import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import Department from '@/models/Department';
import { logAudit } from '@/lib/audit';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    const dept = await Department.findById(id).lean();
    if (!dept) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ id: dept._id.toString(), name: dept.name, description: dept.description || '' });
  } catch (err) {
    console.error('GET /api/departments/[id]:', err);
    return NextResponse.json({ error: 'Failed to fetch department' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.user.roles?.includes('super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;
    await connectDB();
    const dept = await Department.findById(id);
    if (!dept) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (name?.trim()) dept.name = name.trim();
    if (description !== undefined) dept.description = description?.trim() || '';
    await dept.save();
    await logAudit(session.user.id, 'update', 'Department', dept._id, { name: dept.name }, request);
    return NextResponse.json({ id: dept._id.toString(), name: dept.name, description: dept.description });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'Department name already exists' }, { status: 400 });
    }
    console.error('PUT /api/departments/[id]:', err);
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.user.roles?.includes('super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id } = await params;
    await connectDB();
    const dept = await Department.findById(id);
    if (!dept) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await Department.findByIdAndDelete(id);
    await logAudit(session.user.id, 'delete', 'Department', id, { name: dept.name }, request);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/departments/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 });
  }
}
