import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import SOP from '@/models/SOP';
import Department from '@/models/Department';
import { logAudit } from '@/lib/audit';

function canAccess(session, sop) {
  if (session.user.roles?.includes('super_admin')) return true;
  const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
  const deptId = sop.department?.toString?.() || sop.department;
  return userDeptIds.includes(deptId);
}

function canEdit(session, sop) {
  if (session.user.roles?.includes('super_admin')) return true;
  if (sop.status === 'draft' && sop.author?.toString() === session.user.id) return true;
  if (sop.editPermission && sop.author?.toString() === session.user.id) return true;
  return false;
}

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    const sop = await SOP.findById(id)
      .populate('author', 'username')
      .populate('department', 'name')
      .populate('approvedBy', 'username')
      .populate('submittedBy', 'username')
      .lean();
    if (!sop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
    const deptId = sop.department?._id?.toString() || sop.department?.toString();
    if (!session.user.roles?.includes('super_admin') && !userDeptIds.includes(deptId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const canEditSop = canEdit(session, { ...sop, author: sop.author?._id || sop.author });
    return NextResponse.json({
      ...sop,
      id: sop._id.toString(),
      author: sop.author?.username,
      authorId: sop.author?._id?.toString(),
      department: sop.department?.name,
      departmentId: sop.department?._id?.toString(),
      approvedBy: sop.approvedBy?.username,
      approvedById: sop.approvedBy?._id?.toString(),
      submittedBy: sop.submittedBy?.username,
      canEdit: canEditSop,
    });
  } catch (err) {
    console.error('GET /api/sops/[id]:', err);
    return NextResponse.json({ error: 'Failed to fetch SOP' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    await connectDB();
    const sop = await SOP.findById(id);
    if (!sop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!canEdit(session, sop)) {
      return NextResponse.json({ error: 'You do not have permission to edit this SOP' }, { status: 403 });
    }

    const allowed = ['title', 'purpose', 'scope', 'procedure', 'responsibilities', 'accountability', 'exceptions'];
    for (const key of allowed) {
      if (body[key] !== undefined) sop[key] = body[key];
    }
    await sop.save();
    await logAudit(session.user.id, 'update', 'SOP', sop._id, { title: sop.title }, request);
    return NextResponse.json({ id: sop._id.toString(), title: sop.title, status: sop.status });
  } catch (err) {
    console.error('PUT /api/sops/[id]:', err);
    return NextResponse.json({ error: 'Failed to update SOP' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    const sop = await SOP.findById(id);
    if (!sop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const canDelete = session.user.roles?.includes('super_admin') || sop.author?.toString() === session.user.id;
    if (!canDelete) {
      return NextResponse.json({ error: 'You do not have permission to delete this SOP' }, { status: 403 });
    }
    await SOP.findByIdAndDelete(id);
    await logAudit(session.user.id, 'delete', 'SOP', id, { title: sop.title }, request);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/sops/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete SOP' }, { status: 500 });
  }
}
