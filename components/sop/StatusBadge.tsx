import classNames from 'classnames';
import {
  DocumentDuplicateIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const statusConfig = {
  draft: { icon: DocumentDuplicateIcon, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Draft' },
  submitted: { icon: ClockIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Pending Review' },
  approved: { icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Approved' },
  rejected: { icon: ExclamationCircleIcon, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Rejected' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;
  return (
    <span
      className={classNames(
        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
        config.bg,
        config.color,
        config.border
      )}
    >
      <Icon className="w-4 h-4 mr-1" />
      {config.label}
    </span>
  );
}
