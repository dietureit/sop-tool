'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import SOPCard from '@/components/sop/SOPCard';
import StatusBadge from '@/components/sop/StatusBadge';
import AnalyticsCards from '@/components/dashboard/AnalyticsCards';
import SOPFilterBar from '@/components/dashboard/SOPFilterBar';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function DashboardClient({ user }) {
  const [sops, setSops] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [analytics, setAnalytics] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [searchTerm, statusFilter, departmentFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);
      if (statusFilter) params.set('status', statusFilter);
      if (departmentFilter) params.set('department', departmentFilter);

      const [sopsRes, deptsRes, countsRes] = await Promise.all([
        fetch(`/api/sops?${params}`),
        fetch('/api/departments'),
        fetch('/api/sops?countsOnly=true'),
      ]);

      if (sopsRes.ok) {
        const data = await sopsRes.json();
        setSops(data.sops || []);
      }
      if (deptsRes.ok) {
        const depts = await deptsRes.json();
        setDepartments(depts);
      }
      if (countsRes.ok) {
        const counts = await countsRes.json();
        setAnalytics({
          total: counts.total || 0,
          pending: counts.submitted || 0,
          approved: counts.approved || 0,
          rejected: counts.rejected || 0,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (sop) => {
    if (!confirm('Are you sure you want to delete this SOP?')) return;
    try {
      const res = await fetch(`/api/sops/${sop.id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
      else alert('Failed to delete');
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const canCreate = user?.roles?.includes('sop_writer') || user?.roles?.includes('super_admin');
  const isSuperAdmin = user?.roles?.includes('super_admin');

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-[#111827]">Dashboard</h1>
          {canCreate && (
            <Link
              href="/sop/create"
              className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Create New SOP
            </Link>
          )}
        </div>

        <AnalyticsCards {...analytics} />

        <SOPFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          departments={departments}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {isLoading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : sops.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <p className="text-gray-500">No SOPs found.</p>
            {canCreate && (
              <Link href="/sop/create" className="mt-4 inline-block text-black font-medium hover:underline">
                Create your first SOP
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sops.map((sop) => (
              <SOPCard
                key={sop.id}
                sop={sop}
                onDelete={handleDelete}
                canEdit={
                  (sop.status === 'draft' && sop.authorId === user?.id) ||
                  isSuperAdmin
                }
                canDelete={sop.authorId === user?.id || isSuperAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Title</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Department</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Version</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Author</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sops.map((sop) => (
                  <tr key={sop.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/sop/${sop.id}`} className="font-medium text-[#111827] hover:underline">
                        {sop.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{sop.department}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={sop.status} />
                    </td>
                    <td className="px-6 py-4 text-gray-600">v{sop.version}</td>
                    <td className="px-6 py-4 text-gray-600">{sop.author}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Link
                          href={`/sop/${sop.id}`}
                          className="text-black hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                        >
                          View
                        </Link>
                        {((sop.status === 'draft' && sop.authorId === user?.id) || isSuperAdmin) && (
                          <Link
                            href={`/sop/${sop.id}/edit`}
                            className="text-black hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100"
                          >
                            Edit
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
