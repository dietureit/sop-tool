import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import AdminClient from './AdminClient';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!session.user.roles?.includes('super_admin')) redirect('/dashboard');
  return <AdminClient user={session.user} />;
}
