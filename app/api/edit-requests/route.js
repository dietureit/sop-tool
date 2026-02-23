import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import EditRequest from '@/models/EditRequest';
import SOP from '@/models/SOP';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const canView = session.user.roles?.includes('sop_approver') || session.user.roles?.includes('super_admin');
    if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    await connectDB();
    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
    let query = { status };
    if (!session.user.roles?.includes('super_admin') && userDeptIds.length) {
      const sopsInDept = await SOP.find({ department: { $in: userDeptIds } }).distinct('_id');
      query.sop = { $in: sopsInDept };
    }

    const requests = await EditRequest.find(query)
      .populate('sop', 'title')
      .populate('requester', 'username')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      requests.map((r) => ({
        id: r._id.toString(),
        sopId: r.sop?._id?.toString(),
        sopTitle: r.sop?.title,
        requester: r.requester?.username,
        requesterId: r.requester?._id?.toString(),
        reason: r.reason,
        status: r.status,
        responseMessage: r.responseMessage,
        createdAt: r.createdAt,
      }))
    );
  } catch (err) {
    console.error('GET /api/edit-requests:', err);
    return NextResponse.json({ error: 'Failed to fetch edit requests' }, { status: 500 });
  }
}
