import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/User';

/**
 * Debug endpoint to verify admin user exists and password works.
 * Remove or protect in production.
 */
export async function POST(request) {
  try {
    const { username = 'admin', password = 'admin' } = await request.json().catch(() => ({}));
    await connectDB();

    const user = await User.findOne({ username: username.trim() }).select('username passwordHash isActive');
    if (!user) {
      return NextResponse.json({ ok: false, error: 'User not found' });
    }
    if (!user.isActive) {
      return NextResponse.json({ ok: false, error: 'User inactive' });
    }

    const valid = await user.checkPassword(password);
    return NextResponse.json({
      ok: valid,
      error: valid ? null : 'Password mismatch',
      userFound: true,
    });
  } catch (err) {
    console.error('Verify error:', err);
    return NextResponse.json({ ok: false, error: String(err.message) });
  }
}
