import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import SOPHistoryClient from './SOPHistoryClient';

export default async function SOPHistoryPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  const { id } = await params;
  return <SOPHistoryClient sopId={id} user={session.user} />;
}
