import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import EditSOPClient from './EditSOPClient';

export default async function EditSOPPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const { id } = await params;
  return <EditSOPClient sopId={id} user={session.user} />;
}
