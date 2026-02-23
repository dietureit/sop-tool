'use client';

import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export default function AnalyticsCards({ total, pending, approved, rejected }) {
  const cards = [
    { label: 'Total SOPs', value: total, icon: DocumentTextIcon, color: 'text-gray-600', bg: 'bg-gray-50' },
    { label: 'Pending Review', value: pending, icon: ClockIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Approved', value: approved, icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Rejected', value: rejected, icon: ExclamationCircleIcon, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl font-semibold text-[#111827] mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
