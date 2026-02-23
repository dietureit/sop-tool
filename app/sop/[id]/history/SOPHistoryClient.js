'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { formatDate } from '@/lib/utils';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function SOPHistoryClient({ sopId, user }) {
  const [sop, setSop] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [sopRes, verRes] = await Promise.all([
        fetch(`/api/sops/${sopId}`),
        fetch(`/api/sops/${sopId}/versions`),
      ]);
      if (sopRes.ok) setSop(await sopRes.json());
      if (verRes.ok) setVersions(await verRes.json());
      setLoading(false);
    })();
  }, [sopId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar user={user} />
        <main className="max-w-2xl mx-auto px-8 py-8">
          <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />
      <main className="max-w-2xl mx-auto px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/sop/${sopId}`} className="p-2 hover:bg-gray-50 rounded-xl">
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[#111827]">Version History</h1>
            <p className="text-gray-600 text-sm">{sop?.title}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-l-4 border-black pl-6 py-4 bg-gray-50 rounded-r-xl">
            <p className="font-medium">Current (v{sop?.version})</p>
            <p className="text-sm text-gray-500">Latest version</p>
          </div>
          {versions.map((v) => (
            <div key={v.id} className="border-l-4 border-gray-200 pl-6 py-4">
              <p className="font-medium">Version {v.versionNumber}</p>
              <p className="text-sm text-gray-500">{formatDate(v.createdAt)}</p>
              {v.title && <p className="text-sm text-gray-600 mt-1">{v.title}</p>}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
