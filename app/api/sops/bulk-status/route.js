import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import SOP from '@/models/SOP';
import { logAudit } from '@/lib/audit';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.user.roles?.includes('super_admin')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { ids, status } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json({ error: 'ids and status required' }, { status: 400 });
    }
    const valid = ['draft', 'submitted', 'approved', 'rejected'];
    if (!valid.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });

    await connectDB();
    const result = await SOP.updateMany({ _id: { $in: ids } }, { $set: { status } });
    for (const id of ids) {
      await logAudit(session.user.id, 'update', 'SOP', id, { action: 'bulk-status', status }, request);
    }
    return NextResponse.json({ success: true, modified: result.modifiedCount });
  } catch (err) {
    console.error('Bulk status error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
