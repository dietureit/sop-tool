'use client';

import Link from 'next/link';
import StatusBadge from './StatusBadge';
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '@/lib/utils';

export default function SOPCard({ sop, onDelete, canEdit = false, canDelete = false }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <Link href={`/sop/${sop.id}`} className="block">
            <h3 className="text-lg font-semibold text-[#111827] mb-2 hover:text-gray-700 truncate">{sop.title}</h3>
          </Link>
          <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600">
            <span>{sop.department}</span>
            <span>•</span>
            <span>v{sop.version}</span>
            <span>•</span>
            <span>{formatDate(sop.createdAt)}</span>
          </div>
        </div>
        <StatusBadge status={sop.status} />
      </div>
      <div className="mb-6">
        <p className="text-gray-700 text-sm line-clamp-3">{sop.purpose || 'No description available'}</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link
            href={`/sop/${sop.id}`}
            className="flex items-center space-x-1 text-black hover:text-gray-700 transition-colors p-2 rounded-xl hover:bg-gray-50"
            title="View SOP"
          >
            <EyeIcon className="w-5 h-5" />
          </Link>
          {canEdit && (
            <Link
              href={`/sop/${sop.id}/edit`}
              className="flex items-center space-x-1 text-black hover:text-gray-700 transition-colors p-2 rounded-xl hover:bg-gray-50"
              title="Edit SOP"
            >
              <PencilSquareIcon className="w-5 h-5" />
            </Link>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete?.(sop)}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors p-2 rounded-xl hover:bg-red-50"
              title="Delete SOP"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="text-sm text-gray-500">by {sop.author}</div>
      </div>
    </div>
  );
}
