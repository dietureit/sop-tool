import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
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
    const reason = body.reason?.trim();
    if (!reason) return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });

    await connectDB();
    const sop = await SOP.findById(id);
    if (!sop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (sop.status !== 'submitted') return NextResponse.json({ error: 'Only submitted SOPs can be rejected' }, { status: 400 });

    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
    const deptId = sop.department?.toString();
    if (!session.user.roles?.includes('super_admin') && !userDeptIds.includes(deptId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    sop.status = 'rejected';
    sop.rejectionReason = reason;
    await sop.save();

    await logAudit(session.user.id, 'reject', 'SOP', sop._id, { title: sop.title, reason }, request);
    return NextResponse.json({ success: true, status: 'rejected' });
  } catch (err) {
    console.error('POST /api/sops/[id]/reject:', err);
    return NextResponse.json({ error: 'Failed to reject SOP' }, { status: 500 });
  }
}
