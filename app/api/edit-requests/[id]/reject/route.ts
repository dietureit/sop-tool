import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import EditRequest from '@/models/EditRequest';
import SOP from '@/models/SOP';
import Department from '@/models/Department';
import { logAudit } from '@/lib/audit';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const canReject = session.user.roles?.includes('sop_approver') || session.user.roles?.includes('super_admin');
    if (!canReject) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const responseMessage = body.responseMessage?.trim() || 'Edit request rejected';

    await connectDB();
    const er = await EditRequest.findById(id).populate('sop');
    if (!er) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (er.status !== 'pending') return NextResponse.json({ error: 'Request already processed' }, { status: 400 });

    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
    const deptId = er.sop?.department?.toString();
    if (!session.user.roles?.includes('super_admin') && !userDeptIds.includes(deptId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    er.status = 'rejected';
    er.approver = session.user.id;
    er.responseMessage = responseMessage;
    await er.save();

    await logAudit(session.user.id, 'reject', 'EditRequest', er._id, { sopId: er.sop._id }, request);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/edit-requests/[id]/reject:', err);
    return NextResponse.json({ error: 'Failed to reject edit request' }, { status: 500 });
  }
}
