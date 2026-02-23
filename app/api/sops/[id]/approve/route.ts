import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import SOP from '@/models/SOP';
import SOPVersion from '@/models/SOPVersion';
import Department from '@/models/Department';
import { logAudit } from '@/lib/audit';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const canApprove = session.user.roles?.includes('sop_approver') || session.user.roles?.includes('super_admin');
    if (!canApprove) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    await connectDB();
    const sop = await SOP.findById(id);
    if (!sop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (sop.status !== 'submitted') return NextResponse.json({ error: 'Only submitted SOPs can be approved' }, { status: 400 });

    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
    const deptId = sop.department?.toString();
    if (!session.user.roles?.includes('super_admin') && !userDeptIds.includes(deptId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await SOPVersion.create({
      sop: sop._id,
      versionNumber: sop.version,
      title: sop.title,
      purpose: sop.purpose,
      scope: sop.scope,
      procedure: sop.procedure,
      responsibilities: sop.responsibilities,
      accountability: sop.accountability,
      exceptions: sop.exceptions,
    });

    sop.status = 'approved';
    sop.version += 1;
    sop.approvedBy = session.user.id;
    sop.approvedAt = new Date();
    sop.rejectionReason = undefined;
    await sop.save();

    await logAudit(session.user.id, 'approve', 'SOP', sop._id, { title: sop.title }, request);
    return NextResponse.json({ success: true, status: 'approved', version: sop.version });
  } catch (err) {
    console.error('POST /api/sops/[id]/approve:', err);
    return NextResponse.json({ error: 'Failed to approve SOP' }, { status: 500 });
  }
}
