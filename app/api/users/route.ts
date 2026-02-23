import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { logAudit } from '@/lib/audit';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.user.roles?.includes('super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const users = await User.find()
      .populate('departments', 'name _id')
      .select('-passwordHash')
      .lean();
    return NextResponse.json(
      users.map((u) => ({
        id: u._id.toString(),
        username: u.username,
        email: u.email,
        roles: u.roles || [],
        departments: u.departments?.map((d) => ({ id: d._id.toString(), name: d.name })) || [],
        isActive: u.isActive,
        createdAt: u.createdAt,
      }))
    );
  } catch (err) {
    console.error('GET /api/users:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
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
    const { username, email, password, roles, departments } = body;
    if (!username?.trim()) return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    if (!password?.trim()) return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    if (!roles?.length) return NextResponse.json({ error: 'At least one role is required' }, { status: 400 });
    const validRoles = ['super_admin', 'sop_writer', 'sop_approver'];
    const invalidRoles = roles.filter((r) => !validRoles.includes(r));
    if (invalidRoles.length) return NextResponse.json({ error: `Invalid roles: ${invalidRoles.join(', ')}` }, { status: 400 });
    await connectDB();
    const existing = await User.findOne({ $or: [{ username: username.trim() }, { email: email.trim().toLowerCase() }] });
    if (existing) return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 });
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      roles,
      departments: departments || [],
      isActive: true,
    });
    await logAudit(session.user.id, 'create', 'User', user._id, { username: user.username }, request);
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
    console.error('POST /api/users:', err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
