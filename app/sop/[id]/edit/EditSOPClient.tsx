'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import ProcedureStepBuilder from '@/components/sop/ProcedureStepBuilder';
import RoleSelector from '@/components/sop/RoleSelector';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function EditSOPClient({ sopId, user }) {
  const router = useRouter();
  const [sop, setSop] = useState<any | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [formData, setFormData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const [sopRes, dRes, rRes] = await Promise.all([
        fetch(`/api/sops/${sopId}`),
        fetch('/api/departments'),
        fetch('/api/role-definitions'),
      ]);
      if (sopRes.ok) {
        const s = await sopRes.json();
        setSop(s);
        if (!s.canEdit) {
          router.push(`/sop/${sopId}`);
          return;
        }
        setFormData({
          title: s.title,
          department: s.departmentId,
          purpose: s.purpose,
          scope: s.scope,
          procedure: s.procedure || [],
          responsibilities: s.responsibilities || [],
          accountability: s.accountability || [],
          exceptions: s.exceptions || '',
        });
      } else {
        router.push('/dashboard');
      }
      if (dRes.ok) setDepartments(await dRes.json());
      if (rRes.ok) {
        const r = await rRes.json();
        setRoles(r.map((x) => ({ id: x.id, name: x.name, description: x.description })));
      }
    })();
  }, [sopId]);

  const addResponsibility = () => {
    setFormData((p) => ({
      ...p,
      responsibilities: [...(p.responsibilities || []), { role: '', description: '' }],
    }));
  };
  const updateResponsibility = (i, field, val) => {
    setFormData((p) => {
      const r = [...(p.responsibilities || [])];
      r[i] = { ...r[i], [field]: typeof val === 'object' && val?.name ? val.name : val };
      return { ...p, responsibilities: r };
    });
  };
  const removeResponsibility = (i) => {
    setFormData((p) => ({
      ...p,
      responsibilities: (p.responsibilities || []).filter((_, j) => j !== i),
    }));
  };

  const addAccountability = () => {
    setFormData((p) => ({
      ...p,
      accountability: [...(p.accountability || []), { role: '', description: '' }],
    }));
  };
  const updateAccountability = (i, field, val) => {
    setFormData((p) => {
      const a = [...(p.accountability || [])];
      a[i] = { ...a[i], [field]: typeof val === 'object' && val?.name ? val.name : val };
      return { ...p, accountability: a };
    });
  };
  const removeAccountability = (i) => {
    setFormData((p) => ({
      ...p,
      accountability: (p.accountability || []).filter((_, j) => j !== i),
    }));
  };

  const handleSubmit = async () => {
    if (!formData) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/sops/${sopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update');
      router.push(`/sop/${sopId}`);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (!formData) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar user={user} />
        <main className="max-w-4xl mx-auto px-8 py-8">
          <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
        </main>
      </div>
    );
  }

  const userDeptIds = (user?.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
  const allowedDepts = user?.roles?.includes('super_admin')
    ? departments
    : departments.filter((d) => userDeptIds.includes(d.id));

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />
      <main className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href={`/sop/${sopId}`} className="p-2 hover:bg-gray-50 rounded-xl">
              <ArrowLeftIcon className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-[#111827]">Edit SOP</h1>
              <p className="text-gray-600 text-sm">{formData.title}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">SOP Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">Department *</label>
              <select
                required
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                {allowedDepts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-[#374151] mb-2">Purpose *</label>
            <textarea
              required
              rows={4}
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-[#374151] mb-2">Scope *</label>
            <textarea
              required
              rows={4}
              value={formData.scope}
              onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
            />
          </div>

          <div className="mb-8">
            <ProcedureStepBuilder
              steps={formData.procedure}
              onChange={(procedure) => setFormData({ ...formData, procedure })}
            />
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-medium text-[#374151] mb-4">Governance</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-600">Responsibilities</label>
                  <button type="button" onClick={addResponsibility} className="text-sm flex items-center gap-1">
                    <PlusIcon className="w-4 h-4" /> Add
                  </button>
                </div>
                {(formData.responsibilities || []).map((r, i) => (
                  <div key={i} className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <RoleSelector
                        roles={roles}
                        value={r.role}
                        onChange={(roleObj) => updateResponsibility(i, 'role', roleObj)}
                        placeholder="Select role"
                      />
                    </div>
                    <div className="flex-[2]">
                      <input
                        type="text"
                        value={r.description || ''}
                        onChange={(e) => updateResponsibility(i, 'description', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200"
                        placeholder="Description"
                      />
                    </div>
                    <button type="button" onClick={() => removeResponsibility(i)} className="text-red-600 p-2">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-600">Accountability</label>
                  <button type="button" onClick={addAccountability} className="text-sm flex items-center gap-1">
                    <PlusIcon className="w-4 h-4" /> Add
                  </button>
                </div>
                {(formData.accountability || []).map((a, i) => (
                  <div key={i} className="flex gap-4 mb-4">
                    <div className="flex-1">
                      <RoleSelector
                        roles={roles}
                        value={a.role}
                        onChange={(roleObj) => updateAccountability(i, 'role', roleObj)}
                        placeholder="Select role"
                      />
                    </div>
                    <div className="flex-[2]">
                      <input
                        type="text"
                        value={a.description || ''}
                        onChange={(e) => updateAccountability(i, 'description', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200"
                        placeholder="Description"
                      />
                    </div>
                    <button type="button" onClick={() => removeAccountability(i)} className="text-red-600 p-2">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Exceptions</label>
                <textarea
                  rows={2}
                  value={formData.exceptions || ''}
                  onChange={(e) => setFormData({ ...formData, exceptions: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              Save Changes
            </button>
            <Link
              href={`/sop/${sopId}`}
              className="px-6 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 font-medium"
            >
              Cancel
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
