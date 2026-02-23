import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import ViewSOPClient from './ViewSOPClient';

export default async function ViewSOPPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const { id } = await params;
  return <ViewSOPClient sopId={id} user={session.user} />;
}
