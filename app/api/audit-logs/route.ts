import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import AuditLog from '@/models/AuditLog';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!session.user.roles?.includes('super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const user = searchParams.get('user');
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resourceType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    await connectDB();
    let query: Record<string, any> = {};
    if (user) query.user = user;
    if (action) query.action = action;
    if (resourceType) query.resourceType = resourceType;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate + 'T23:59:59.999Z');
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('user', 'username')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return NextResponse.json({
      logs: logs.map((l) => ({
        id: l._id.toString(),
        user: l.user?.username,
        userId: l.user?._id?.toString(),
        action: l.action,
        resourceType: l.resourceType,
        resourceId: l.resourceId?.toString(),
        details: l.details,
        ipAddress: l.ipAddress,
        userAgent: l.userAgent,
        timestamp: l.timestamp,
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    console.error('GET /api/audit-logs:', err);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
