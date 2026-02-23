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
    const canSubmit = session.user.roles?.includes('sop_writer') || session.user.roles?.includes('super_admin');
    if (!canSubmit) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    await connectDB();
    const sop = await SOP.findById(id);
    if (!sop) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (sop.status !== 'draft') return NextResponse.json({ error: 'Only draft SOPs can be submitted' }, { status: 400 });
    if (sop.author?.toString() !== session.user.id && !session.user.roles?.includes('super_admin')) {
      return NextResponse.json({ error: 'Only the author can submit this SOP' }, { status: 403 });
    }

    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
    const deptId = sop.department?.toString();
    if (!session.user.roles?.includes('super_admin') && !userDeptIds.includes(deptId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    sop.status = 'submitted';
    sop.submittedBy = session.user.id;
    sop.submittedAt = new Date();
    await sop.save();

    await logAudit(session.user.id, 'update', 'SOP', sop._id, { action: 'submit', title: sop.title }, request);
    return NextResponse.json({ success: true, status: 'submitted' });
  } catch (err) {
    console.error('POST /api/sops/[id]/submit:', err);
    return NextResponse.json({ error: 'Failed to submit SOP' }, { status: 500 });
  }
}
