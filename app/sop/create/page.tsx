import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import CreateSOPClient from './CreateSOPClient';

export default async function CreateSOPPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const canCreate = session.user.roles?.includes('sop_writer') || session.user.roles?.includes('super_admin');
  if (!canCreate) redirect('/dashboard');
  return <CreateSOPClient user={session.user} />;
}
