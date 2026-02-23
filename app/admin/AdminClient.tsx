'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { Tab } from '@headlessui/react';
import { Fragment } from 'react';
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

function UserTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ username: '', email: '', password: '', roles: [], departments: [] });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    const res = await fetch('/api/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };
  const fetchDepartments = async () => {
    const res = await fetch('/api/departments');
    if (res.ok) setDepartments(await res.json());
  };

  const saveUser = async () => {
    const url = editing ? `/api/users/${editing.id}` : '/api/users';
    const method = editing ? 'PUT' : 'POST';
    const body = editing
      ? { ...form, id: undefined }
      : { ...form };
    if (!editing && !body.password) return alert('Password required');
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowForm(false);
      setEditing(null);
      setForm({ username: '', email: '', password: '', roles: [], departments: [] });
      fetchUsers();
    } else {
      alert((await res.json()).error || 'Failed');
    }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) fetchUsers();
    else alert((await res.json()).error || 'Failed');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Users</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ username: '', email: '', password: '', roles: [], departments: [] }); }}
          className="px-4 py-2 rounded-xl bg-black text-white text-sm hover:bg-gray-800"
        >
          Add User
        </button>
      </div>
      {showForm && (
        <div className="mb-6 p-6 border border-gray-200 rounded-2xl bg-gray-50">
          <h3 className="font-medium mb-4">{editing ? 'Edit User' : 'New User'}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="px-4 py-2 rounded-xl border"
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-4 py-2 rounded-xl border"
            />
            {!editing && (
              <input
                placeholder="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="px-4 py-2 rounded-xl border"
              />
            )}
          </div>
          <div className="flex gap-4 mb-4">
            {['super_admin', 'sop_writer', 'sop_approver'].map((r) => (
              <label key={r} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.roles?.includes(r)}
                  onChange={(e) => {
                    const roles = e.target.checked ? [...(form.roles || []), r] : (form.roles || []).filter((x) => x !== r);
                    setForm({ ...form, roles });
                  }}
                />
                {r}
              </label>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            {departments.map((d) => (
              <label key={d.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.departments?.includes(d.id)}
                  onChange={(e) => {
                    const depts = e.target.checked ? [...(form.departments || []), d.id] : (form.departments || []).filter((x) => x !== d.id);
                    setForm({ ...form, departments: depts });
                  }}
                />
                {d.name}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={saveUser} className="px-4 py-2 rounded-xl bg-black text-white text-sm">Save</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 rounded-xl border">Cancel</button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      ) : (
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-4">Username</th>
                <th className="text-left px-6 py-4">Email</th>
                <th className="text-left px-6 py-4">Roles</th>
                <th className="text-left px-6 py-4">Departments</th>
                <th className="text-left px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-6 py-4">{u.username}</td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">{u.roles?.join(', ')}</td>
                  <td className="px-6 py-4">{u.departments?.map((d) => d.name).join(', ')}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => { setEditing(u); setForm({ username: u.username, email: u.email, roles: u.roles, departments: u.departments?.map((d) => d.id) || [] }); setShowForm(true); }} className="text-black hover:underline mr-2">Edit</button>
                    <button onClick={() => deleteUser(u.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DepartmentTab() {
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ name: '', description: '' });

  useEffect(() => { fetchDepts(); }, []);

  const fetchDepts = async () => {
    const res = await fetch('/api/departments');
    if (res.ok) setDepts(await res.json());
    setLoading(false);
  };

  const save = async () => {
    const url = editing ? `/api/departments/${editing.id}` : '/api/departments';
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', description: '' });
      fetchDepts();
    } else alert((await res.json()).error || 'Failed');
  };

  const remove = async (id) => {
    if (!confirm('Delete?')) return;
    const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
    if (res.ok) fetchDepts();
    else alert((await res.json()).error || 'Failed');
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-lg font-semibold">Departments</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', description: '' }); }} className="px-4 py-2 rounded-xl bg-black text-white text-sm">Add Department</button>
      </div>
      {showForm && (
        <div className="mb-6 p-6 border rounded-2xl bg-gray-50">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 rounded-xl border mb-2" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 rounded-xl border mb-4" />
          <button onClick={save} className="px-4 py-2 rounded-xl bg-black text-white text-sm mr-2">Save</button>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border">Cancel</button>
        </div>
      )}
      {loading ? <div className="h-32 bg-gray-100 rounded-xl animate-pulse" /> : (
        <div className="border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="text-left px-6 py-4">Name</th><th className="text-left px-6 py-4">Description</th><th className="text-left px-6 py-4">SOPs</th><th className="text-left px-6 py-4">Actions</th></tr></thead>
            <tbody>
              {depts.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-6 py-4">{d.name}</td>
                  <td className="px-6 py-4">{d.description}</td>
                  <td className="px-6 py-4">{d.sopCount}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => { setEditing(d); setForm({ name: d.name, description: d.description }); setShowForm(true); }} className="mr-2 hover:underline">Edit</button>
                    <button onClick={() => remove(d.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RoleTab() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ name: '', description: '' });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    const res = await fetch('/api/role-definitions?all=true');
    if (res.ok) setRoles(await res.json());
    setLoading(false);
  };

  const save = async () => {
    const url = editing ? `/api/role-definitions/${editing.id}` : '/api/role-definitions';
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowForm(false);
      setEditing(null);
      setForm({ name: '', description: '' });
      fetchRoles();
    } else alert((await res.json()).error || 'Failed');
  };

  const remove = async (id) => {
    if (!confirm('Delete?')) return;
    const res = await fetch(`/api/role-definitions/${id}`, { method: 'DELETE' });
    if (res.ok) fetchRoles();
    else alert((await res.json()).error || 'Failed');
  };

  return (
    <div>
      <div className="flex justify-between mb-6">
        <h2 className="text-lg font-semibold">Role Definitions</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: '', description: '' }); }} className="px-4 py-2 rounded-xl bg-black text-white text-sm">Add Role</button>
      </div>
      {showForm && (
        <div className="mb-6 p-6 border rounded-2xl bg-gray-50">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2 rounded-xl border mb-2" />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 rounded-xl border mb-4" />
          <button onClick={save} className="px-4 py-2 rounded-xl bg-black text-white text-sm mr-2">Save</button>
          <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl border">Cancel</button>
        </div>
      )}
      {loading ? <div className="h-32 bg-gray-100 rounded-xl animate-pulse" /> : (
        <div className="border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="text-left px-6 py-4">Name</th><th className="text-left px-6 py-4">Description</th><th className="text-left px-6 py-4">Actions</th></tr></thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-6 py-4">{r.name}</td>
                  <td className="px-6 py-4">{r.description}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => { setEditing(r); setForm({ name: r.name, description: r.description }); setShowForm(true); }} className="mr-2 hover:underline">Edit</button>
                    <button onClick={() => remove(r.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminClient({ user }) {
  const tabs = [
    { name: 'Users', icon: UserGroupIcon, content: <UserTab /> },
    { name: 'Departments', icon: BuildingOfficeIcon, content: <DepartmentTab /> },
    { name: 'Role Definitions', icon: IdentificationIcon, content: <RoleTab /> },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-[#111827]">Admin Panel</h1>
          <Link href="/admin/audit-logs" className="flex items-center gap-2 px-4 py-2 rounded-xl border hover:bg-gray-50">
            <ClipboardDocumentListIcon className="w-5 h-5" />
            Audit Logs
          </Link>
        </div>

        <Tab.Group>
          <Tab.List className="flex gap-2 border-b border-gray-200 mb-6">
            {tabs.map((tab) => (
              <Tab key={tab.name} as={Fragment}>
                {({ selected }) => (
                  <button
                    className={`flex items-center gap-2 px-6 py-3 border-b-2 -mb-px ${
                      selected ? 'border-black font-medium' : 'border-transparent text-gray-500'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.name}
                  </button>
                )}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            {tabs.map((tab) => (
              <Tab.Panel key={tab.name}>{tab.content}</Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </main>
    </div>
  );
}
