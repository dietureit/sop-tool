'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { formatDateTime } from '@/lib/utils';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AuditLogsClient({ user }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', resourceType: '', page: 1 });

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.action) params.set('action', filters.action);
    if (filters.resourceType) params.set('resourceType', filters.resourceType);
    params.set('page', filters.page);
    const res = await fetch(`/api/audit-logs?${params}`);
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin" className="p-2 hover:bg-gray-50 rounded-xl">
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-semibold text-[#111827]">Audit Logs</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
            className="px-4 py-2 rounded-xl border border-gray-200"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
            <option value="login">Login</option>
          </select>
          <select
            value={filters.resourceType}
            onChange={(e) => setFilters({ ...filters, resourceType: e.target.value, page: 1 })}
            className="px-4 py-2 rounded-xl border border-gray-200"
          >
            <option value="">All Resources</option>
            <option value="SOP">SOP</option>
            <option value="User">User</option>
            <option value="Department">Department</option>
          </select>
        </div>

        {loading ? (
          <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
        ) : (
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-4">Timestamp</th>
                  <th className="text-left px-6 py-4">User</th>
                  <th className="text-left px-6 py-4">Action</th>
                  <th className="text-left px-6 py-4">Resource</th>
                  <th className="text-left px-6 py-4">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="px-6 py-4">{formatDateTime(l.timestamp)}</td>
                    <td className="px-6 py-4">{l.user}</td>
                    <td className="px-6 py-4">{l.action}</td>
                    <td className="px-6 py-4">{l.resourceType} {l.resourceId ? `(${l.resourceId})` : ''}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{l.details}</td>
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
