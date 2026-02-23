import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import RoleDefinition from '@/models/RoleDefinition';
import { logAudit } from '@/lib/audit';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url || '', 'http://localhost');
    const all = searchParams.get('all') === 'true' && session.user.roles?.includes('super_admin');
    await connectDB();
    const query = all ? {} : { isActive: true };
    const roles = await RoleDefinition.find(query).sort({ name: 1 }).lean();
    return NextResponse.json(roles.map((r) => ({ id: r._id.toString(), name: r.name, description: r.description || '' })));
  } catch (err) {
    console.error('GET /api/role-definitions:', err);
    return NextResponse.json({ error: 'Failed to fetch role definitions' }, { status: 500 });
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
    const role = await RoleDefinition.create({ name: name.trim(), description: description?.trim() || '', isActive: true });
    await logAudit(session.user.id, 'create', 'RoleDefinition', role._id, { name: role.name }, request);
    return NextResponse.json({ id: role._id.toString(), name: role.name, description: role.description });
  } catch (err) {
    console.error('POST /api/role-definitions:', err);
    return NextResponse.json({ error: 'Failed to create role definition' }, { status: 500 });
  }
}
