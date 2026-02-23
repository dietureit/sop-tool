import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default async function SecurityPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect('/login');
  if (!session.user.roles?.includes('super_admin')) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={session.user} />
      <main className="max-w-2xl mx-auto px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 hover:bg-gray-50 rounded-xl">
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-semibold text-[#111827]">Security Settings</h1>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-gray-600">Security settings placeholder. Configure session timeout, password policy, and other security options here.</p>
        </div>
      </main>
    </div>
  );
}
