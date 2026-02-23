'use client';

import { signOut } from 'next-auth/react';
import Link from 'next/link';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  UserCircleIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';

const roleLabels = {
  super_admin: 'Super Admin',
  sop_writer: 'SOP Writer',
  sop_approver: 'SOP Approver',
};

export default function Navbar({ user }) {
  const primaryRole = user?.roles?.[0] || 'User';
  const roleLabel = roleLabels[primaryRole] || primaryRole;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <Image src="/company.svg" alt="Logo" width={50} height={50} />
            </div>
            <span className="text-xl font-semibold text-[#111827]">SOP Manager</span>
          </Link>

          {user && (
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center space-x-3 hover:bg-gray-50 px-4 py-2 rounded-2xl transition-colors duration-200">
                <UserCircleIcon className="w-8 h-8 text-black" />
                <div className="text-left">
                  <span className="block text-black font-medium">{user.username || 'User'}</span>
                  <span className="block text-xs text-gray-500">{roleLabel}</span>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-black" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-2xl shadow-md ring-1 ring-gray-100 focus:outline-none z-50">
                  <div className="p-2">
                    {user.roles?.includes('super_admin') && (
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            href="/admin"
                            className={`${
                              active ? 'bg-gray-50' : ''
                            } group flex w-full items-center rounded-xl px-4 py-3 text-sm text-black font-medium`}
                          >
                            <Cog6ToothIcon className="mr-3 h-5 w-5" />
                            Admin Panel
                          </Link>
                        )}
                      </Menu.Item>
                    )}
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => signOut({ callbackUrl: '/login' })}
                          className={`${
                            active ? 'bg-gray-50' : ''
                          } group flex w-full items-center rounded-xl px-4 py-3 text-sm text-black font-medium`}
                        >
                          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          )}
        </div>
      </div>
    </header>
  );
}
