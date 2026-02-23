import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { logAudit } from '@/lib/audit';

export async function GET(request, { params }) {
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
    const user = await User.findById(id).populate('departments', 'name _id').select('-passwordHash').lean();
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      roles: user.roles,
      departments: user.departments?.map((d) => ({ id: d._id.toString(), name: d.name })) || [],
      isActive: user.isActive,
    });
  } catch (err) {
    console.error('GET /api/users/[id]:', err);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
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
    const { username, email, password, roles, departments, isActive } = body;
    await connectDB();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (username?.trim()) user.username = username.trim();
    if (email?.trim()) user.email = email.trim().toLowerCase();
    if (password?.trim()) user.passwordHash = await (User as any).hashPassword(password);
    if (Array.isArray(roles)) {
      const validRoles = ['super_admin', 'sop_writer', 'sop_approver'];
      user.roles = roles.filter((r) => validRoles.includes(r));
    }
    if (Array.isArray(departments)) user.departments = departments;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    await user.save();
    await logAudit(session.user.id, 'update', 'User', user._id, { username: user.username }, request);
    return NextResponse.json({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      roles: user.roles,
      departments: user.departments,
      isActive: user.isActive,
    });
  } catch (err) {
    if (err.code === 11000) return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
    console.error('PUT /api/users/[id]:', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
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
    if (id === session.user.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    await connectDB();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    await User.findByIdAndDelete(id);
    await logAudit(session.user.id, 'delete', 'User', id, { username: user.username }, request);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/users/[id]:', err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
