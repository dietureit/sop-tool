import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import AuditLogsClient from './AuditLogsClient';

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!session.user.roles?.includes('super_admin')) redirect('/dashboard');
  return <AuditLogsClient user={session.user} />;
}
