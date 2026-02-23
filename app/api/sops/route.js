import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import SOP from '@/models/SOP';
import User from '@/models/User';
import Department from '@/models/Department';
import { logAudit } from '@/lib/audit';

function canAccessSOP(session, sop, isSuperAdmin, userDeptIds) {
  if (isSuperAdmin) return true;
  const deptId = sop.department?.toString?.() || sop.department;
  return userDeptIds.includes(deptId);
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const countsOnly = searchParams.get('countsOnly') === 'true';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const department = searchParams.get('department') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    await connectDB();
    const isSuperAdmin = session.user.roles?.includes('super_admin');
    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));

    let query = {};
    if (!isSuperAdmin && userDeptIds.length) {
      const allowedDeptIds = await Department.find({ _id: { $in: userDeptIds } }).distinct('_id');
      query.department = department
        ? allowedDeptIds.some((d) => d.toString() === department)
          ? department
          : 'nonexistent'
        : { $in: allowedDeptIds };
    } else if (department) {
      query.department = department;
    }
    if (query.department === 'nonexistent') return NextResponse.json({ sops: [], total: 0, page: 1, limit });
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } },
        { scope: { $regex: search, $options: 'i' } },
      ];
    }

    if (countsOnly) {
      const [total, submitted, approved, rejected] = await Promise.all([
        SOP.countDocuments(query),
        SOP.countDocuments({ ...query, status: 'submitted' }),
        SOP.countDocuments({ ...query, status: 'approved' }),
        SOP.countDocuments({ ...query, status: 'rejected' }),
      ]);
      return NextResponse.json({ total, submitted, approved, rejected });
    }

    const [sops, total] = await Promise.all([
      SOP.find(query)
        .populate('author', 'username')
        .populate('department', 'name')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SOP.countDocuments(query),
    ]);

    const result = sops
      .filter((s) => canAccessSOP(session, s, isSuperAdmin, userDeptIds))
      .map((s) => ({
        id: s._id.toString(),
        title: s.title,
        department: s.department?.name || '',
        departmentId: s.department?._id?.toString(),
        author: s.author?.username || '',
        authorId: s.author?._id?.toString(),
        status: s.status,
        purpose: s.purpose,
        version: s.version,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }));

    return NextResponse.json({ sops: result, total, page, limit });
  } catch (err) {
    console.error('GET /api/sops:', err);
    return NextResponse.json({ error: 'Failed to fetch SOPs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const canCreate = session.user.roles?.includes('sop_writer') || session.user.roles?.includes('super_admin');
    if (!canCreate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, department, purpose, scope, procedure, responsibilities, accountability, exceptions, status } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!department) return NextResponse.json({ error: 'Department is required' }, { status: 400 });
    if (!purpose?.trim()) return NextResponse.json({ error: 'Purpose is required' }, { status: 400 });
    if (!scope?.trim()) return NextResponse.json({ error: 'Scope is required' }, { status: 400 });

    const isSuperAdmin = session.user.roles?.includes('super_admin');
    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
    if (!isSuperAdmin && !userDeptIds.includes(department)) {
      return NextResponse.json({ error: 'You can only create SOPs in your assigned departments' }, { status: 403 });
    }

    await connectDB();
    const sop = await SOP.create({
      title: title.trim(),
      department,
      author: session.user.id,
      status: status || 'draft',
      purpose: purpose.trim(),
      scope: scope.trim(),
      procedure: procedure || [],
      responsibilities: responsibilities || [],
      accountability: accountability || [],
      exceptions: exceptions || '',
    });

    await logAudit(session.user.id, 'create', 'SOP', sop._id, { title: sop.title }, request);
    return NextResponse.json({
      id: sop._id.toString(),
      title: sop.title,
      status: sop.status,
      version: sop.version,
    });
  } catch (err) {
    console.error('POST /api/sops:', err);
    return NextResponse.json({ error: 'Failed to create SOP' }, { status: 500 });
  }
}
