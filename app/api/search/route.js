import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import SOP from '@/models/SOP';
import Department from '@/models/Department';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    await connectDB();
    const isSuperAdmin = session.user.roles?.includes('super_admin');
    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));

    let query = {};
    if (!isSuperAdmin && userDeptIds.length) {
      const allowedDeptIds = await Department.find({ _id: { $in: userDeptIds } }).distinct('_id');
      query.department = { $in: allowedDeptIds };
    }

    if (q.trim()) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { purpose: { $regex: q, $options: 'i' } },
        { scope: { $regex: q, $options: 'i' } },
      ];
    }

    const sops = await SOP.find(query)
      .populate('author', 'username')
      .populate('department', 'name')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(
      sops.map((s) => ({
        id: s._id.toString(),
        title: s.title,
        department: s.department?.name,
        author: s.author?.username,
        status: s.status,
        version: s.version,
      }))
    );
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
