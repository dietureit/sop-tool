import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import SOP from '@/models/SOP';
import EditRequest from '@/models/EditRequest';
import Department from '@/models/Department';
import { logAudit } from '@/lib/audit';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const reason = body.reason?.trim();
    if (!reason) return NextResponse.json({ error: 'Reason is required' }, { status: 400 });

    await connectDB();
    const sop = await SOP.findById(id);
    if (!sop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (sop.status !== 'approved' && sop.status !== 'rejected') {
      return NextResponse.json({ error: 'Edit can only be requested for approved or rejected SOPs' }, { status: 400 });
    }
    if (sop.author?.toString() !== session.user.id && !session.user.roles?.includes('super_admin')) {
      return NextResponse.json({ error: 'Only the author can request edit permission' }, { status: 403 });
    }
    if (sop.editPermission) return NextResponse.json({ error: 'Edit permission already granted' }, { status: 400 });

    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
    const deptId = sop.department?.toString();
    if (!session.user.roles?.includes('super_admin') && !userDeptIds.includes(deptId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await EditRequest.findOne({ sop: id, requester: session.user.id, status: 'pending' });
    if (existing) return NextResponse.json({ error: 'You already have a pending edit request' }, { status: 400 });

    const er = await EditRequest.create({ sop: id, requester: session.user.id, reason });
    await logAudit(session.user.id, 'create', 'EditRequest', er._id, { sopId: id }, request);
    return NextResponse.json({ id: er._id.toString(), success: true });
  } catch (err) {
    console.error('POST /api/sops/[id]/request-edit:', err);
    return NextResponse.json({ error: 'Failed to create edit request' }, { status: 500 });
  }
}
