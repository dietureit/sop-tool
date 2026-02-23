import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import Department from '@/models/Department';
import SOP from '@/models/SOP';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await connectDB();
    const departments = await Department.find().sort({ name: 1 }).lean();
    const sopCounts = await SOP.aggregate([{ $group: { _id: '$department', count: { $sum: 1 } } }]);
    const countMap = Object.fromEntries(sopCounts.map((s) => [s._id?.toString(), s.count]));
    const result = departments.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      description: d.description || '',
      sopCount: countMap[d._id.toString()] || 0,
    }));
    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/departments:', err);
    return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.user.roles?.includes('super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const { name, description } = body;
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    await connectDB();
    const dept = await Department.create({ name: name.trim(), description: description?.trim() || '' });
    await logAudit(session.user.id, 'create', 'Department', dept._id, { name: dept.name }, request);
    return NextResponse.json({ id: dept._id.toString(), name: dept.name, description: dept.description });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 400 });
    }
    console.error('POST /api/departments:', err);
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
  }
}
