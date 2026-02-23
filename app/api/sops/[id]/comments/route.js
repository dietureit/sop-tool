import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import SOPComment from '@/models/SOPComment';
import SOP from '@/models/SOP';
import Department from '@/models/Department';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const sop = await SOP.findById(id);
    if (!sop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
    const deptId = sop.department?.toString();
    if (!session.user.roles?.includes('super_admin') && !userDeptIds.includes(deptId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const comments = await SOPComment.find({ sop: id })
      .populate('user', 'username')
      .sort({ createdAt: 1 })
      .lean();
    return NextResponse.json(
      comments.map((c) => ({
        id: c._id.toString(),
        comment: c.comment,
        user: c.user?.username,
        userId: c.user?._id?.toString(),
        createdAt: c.createdAt,
      }))
    );
  } catch (err) {
    console.error('GET /api/sops/[id]/comments:', err);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const comment = body.comment?.trim();
    if (!comment) return NextResponse.json({ error: 'Comment is required' }, { status: 400 });

    await connectDB();
    const sop = await SOP.findById(id);
    if (!sop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
    const deptId = sop.department?.toString();
    const canComment =
      session.user.roles?.includes('sop_approver') ||
      session.user.roles?.includes('super_admin') ||
      (session.user.roles?.includes('sop_writer') && userDeptIds.includes(deptId));
    if (!canComment) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const c = await SOPComment.create({ sop: id, user: session.user.id, comment });
    return NextResponse.json({
      id: c._id.toString(),
      comment: c.comment,
      user: session.user.username,
      userId: session.user.id,
      createdAt: c.createdAt,
    });
  } catch (err) {
    console.error('POST /api/sops/[id]/comments:', err);
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}
