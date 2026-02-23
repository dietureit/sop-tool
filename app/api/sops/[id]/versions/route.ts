import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import SOPVersion from '@/models/SOPVersion';
import SOP from '@/models/SOP';
import Department from '@/models/Department';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const sop = await SOP.findById(id);
    if (!sop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
    const deptId = sop.department?.toString();
    if (!session.user.roles?.includes('super_admin') && !userDeptIds.includes(deptId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const versions = await SOPVersion.find({ sop: id }).sort({ versionNumber: -1 }).lean();
    return NextResponse.json(
      versions.map((v) => ({
        id: v._id.toString(),
        versionNumber: v.versionNumber,
        title: v.title,
        createdAt: v.createdAt,
      }))
    );
  } catch (err) {
    console.error('GET /api/sops/[id]/versions:', err);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}
