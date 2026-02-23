import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import RoleDefinition from '@/models/RoleDefinition';
import { logAudit } from '@/lib/audit';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    const role = await RoleDefinition.findById(id).lean();
    if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ id: role._id.toString(), name: role.name, description: role.description, isActive: role.isActive });
  } catch (err) {
    console.error('GET /api/role-definitions/[id]:', err);
    return NextResponse.json({ error: 'Failed to fetch role definition' }, { status: 500 });
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
    const { name, description, isActive } = body;
    await connectDB();
    const role = await RoleDefinition.findById(id);
    if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (name?.trim()) role.name = name.trim();
    if (description !== undefined) role.description = description?.trim() || '';
    if (typeof isActive === 'boolean') role.isActive = isActive;
    await role.save();
    await logAudit(session.user.id, 'update', 'RoleDefinition', role._id, { name: role.name }, request);
    return NextResponse.json({ id: role._id.toString(), name: role.name, description: role.description, isActive: role.isActive });
  } catch (err) {
    console.error('PUT /api/role-definitions/[id]:', err);
    return NextResponse.json({ error: 'Failed to update role definition' }, { status: 500 });
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
    const role = await RoleDefinition.findById(id);
    if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await RoleDefinition.findByIdAndDelete(id);
    await logAudit(session.user.id, 'delete', 'RoleDefinition', id, { name: role.name }, request);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/role-definitions/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete role definition' }, { status: 500 });
  }
}
