'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';

export default function RoleSelector({ roles, value, onChange, placeholder = 'Select role' }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleList = roles || [];
  const filtered = roleList.filter((r) =>
    r.name?.toLowerCase().includes(filter?.toLowerCase())
  );
  const selected = roleList.find(
    (r) => r.name === value || (r.id || r._id?.toString()) === (value?.toString?.() || value)
  );

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 cursor-pointer flex items-center justify-between hover:border-gray-300"
      >
        <span className={selected ? 'text-[#111827]' : 'text-gray-500'}>
          {selected?.name || placeholder}
        </span>
        <ChevronUpDownIcon className="w-5 h-5 text-gray-400" />
      </div>
      {open && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search roles..."
            className="w-full px-4 py-2 border-b border-gray-100 focus:outline-none"
          />
          {filtered.map((r) => (
            <div
              key={r.id || r._id}
              onClick={() => {
                onChange(r);
                setOpen(false);
                setFilter('');
              }}
              className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm"
            >
              <div className="font-medium text-[#111827]">{r.name}</div>
              {r.description && (
                <div className="text-gray-500 text-xs mt-0.5">{r.description}</div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-gray-500 text-sm">No roles found</div>
          )}
        </div>
      )}
    </div>
  );
}
