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

    const { ids } = await request.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids required' }, { status: 400 });
    }

    await connectDB();
    const deleted = await SOP.deleteMany({ _id: { $in: ids } });
    for (const id of ids) {
      await logAudit(session.user.id, 'delete', 'SOP', id, { action: 'bulk-delete' }, request);
    }
    return NextResponse.json({ success: true, deleted: deleted.deletedCount });
  } catch (err) {
    console.error('Bulk delete error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
