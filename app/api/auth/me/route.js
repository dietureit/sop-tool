import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return Response.json({
    id: session.user.id,
    username: session.user.username,
    email: session.user.email,
    roles: session.user.roles,
    departments: session.user.departments,
  });
}
