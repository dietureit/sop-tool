'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import StatusBadge from '@/components/sop/StatusBadge';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

export default function ViewSOPClient({ sopId, user }) {
  const router = useRouter();
  const [sop, setSop] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchSOP();
    fetchComments();
  }, [sopId]);

  const fetchSOP = async () => {
    try {
      const res = await fetch(`/api/sops/${sopId}`);
      if (res.ok) setSop(await res.json());
      else if (res.status === 404) router.push('/dashboard');
    } catch (err) {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/sops/${sopId}/comments`);
      if (res.ok) setComments(await res.json());
    } catch (_) {}
  };

  const handleAction = async (action, extra = {}) => {
    setActionLoading(action);
    try {
      const endpoints = {
        submit: { url: `/api/sops/${sopId}/submit`, method: 'POST' },
        approve: { url: `/api/sops/${sopId}/approve`, method: 'POST' },
        reject: { url: `/api/sops/${sopId}/reject`, method: 'POST', body: { reason: rejectReason } },
      };
      const { url, method, body } = endpoints[action] || {};
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) {
        setShowRejectModal(false);
        setRejectReason('');
        fetchSOP();
      } else {
        const data = await res.json();
        alert(data.error || 'Action failed');
      }
    } catch (err) {
      alert('Action failed');
    } finally {
      setActionLoading('');
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await fetch(`/api/sops/${sopId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: newComment.trim() }),
      });
      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (_) {}
  };

  const requestEdit = async () => {
    const reason = prompt('Enter reason for edit request:');
    if (!reason?.trim()) return;
    setActionLoading('requestEdit');
    try {
      const res = await fetch(`/api/sops/${sopId}/request-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (res.ok) fetchSOP();
      else alert((await res.json()).error || 'Failed');
    } catch (_) {}
    setActionLoading('');
  };

  const isApprover = user?.roles?.includes('sop_approver') || user?.roles?.includes('super_admin');
  const canApprove = isApprover && sop?.status === 'submitted';

  if (loading || !sop) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar user={user} />
        <main className="max-w-7xl mx-auto px-8 py-8">
          <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar user={user} />
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="p-2 hover:bg-gray-50 rounded-xl">
            <ArrowLeftIcon className="w-6 h-6" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[#111827]">{sop.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <StatusBadge status={sop.status} />
              <span className="text-gray-500">v{sop.version}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-2">Purpose</h2>
              <p className="text-[#374151]">{sop.purpose}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-2">Scope</h2>
              <p className="text-[#374151]">{sop.scope}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-4">Procedure</h2>
              <div className="space-y-6">
                {(sop.procedure || []).map((step, i) => (
                  <div key={i} className="border-l-4 border-black pl-4">
                    <h3 className="font-medium text-[#111827]">
                      Step {step.stepNumber || i + 1}: {step.title || 'Untitled'}
                    </h3>
                    <p className="text-gray-600 mt-2">{step.description}</p>
                    {(step.checklist || []).length > 0 && (
                      <ul className="mt-3 space-y-1">
                        {step.checklist.map((item, j) => (
                          <li key={j} className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">•</span>
                            {typeof item === 'object' ? item.text : item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {sop.exceptions && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-gray-500 mb-2">Exceptions</h2>
                <p className="text-[#374151]">{sop.exceptions}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-4">Metadata</h2>
              <dl className="space-y-2 text-sm">
                <div><dt className="text-gray-500">Author</dt><dd>{sop.author}</dd></div>
                <div><dt className="text-gray-500">Department</dt><dd>{sop.department}</dd></div>
                <div><dt className="text-gray-500">Created</dt><dd>{formatDate(sop.createdAt)}</dd></div>
                <div><dt className="text-gray-500">Updated</dt><dd>{formatDate(sop.updatedAt)}</dd></div>
                {sop.approvedBy && (
                  <>
                    <div><dt className="text-gray-500">Approved by</dt><dd>{sop.approvedBy}</dd></div>
                    <div><dt className="text-gray-500">Approved at</dt><dd>{formatDate(sop.approvedAt)}</dd></div>
                  </>
                )}
              </dl>
            </div>
            {(sop.responsibilities || []).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-gray-500 mb-4">Responsibilities</h2>
                <ul className="space-y-2 text-sm">
                  {sop.responsibilities.map((r, i) => (
                    <li key={i}><strong>{r.role}</strong>: {r.description}</li>
                  ))}
                </ul>
              </div>
            )}
            {(sop.accountability || []).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h2 className="text-sm font-medium text-gray-500 mb-4">Accountability</h2>
                <ul className="space-y-2 text-sm">
                  {sop.accountability.map((a, i) => (
                    <li key={i}><strong>{a.role}</strong>: {a.description}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-4">Actions</h2>
              <div className="space-y-2">
                {sop.canEdit && (
                  <Link
                    href={`/sop/${sopId}/edit`}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                    Edit SOP
                  </Link>
                )}
                {sop.status === 'draft' && sop.authorId === user?.id && (
                  <button
                    onClick={() => handleAction('submit')}
                    disabled={actionLoading}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-black text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                    Submit for Approval
                  </button>
                )}
                {canApprove && (
                  <>
                    <button
                      onClick={() => handleAction('approve')}
                      disabled={actionLoading}
                      className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircleIcon className="w-5 h-5" />
                      Reject
                    </button>
                  </>
                )}
                {(sop.status === 'approved' || sop.status === 'rejected') && sop.authorId === user?.id && !sop.editPermission && (
                  <button
                    onClick={requestEdit}
                    disabled={actionLoading}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50"
                  >
                    Request Edit Permission
                  </button>
                )}
                <a
                  href={`/api/sops/${sopId}/export-pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 justify-center"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Export PDF
                </a>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 justify-center"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back to Dashboard
                </Link>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-sm font-medium text-gray-500 mb-4">Comments</h2>
              <div className="space-y-4 mb-4">
                {comments.map((c) => (
                  <div key={c.id} className="text-sm">
                    <p className="font-medium">{c.user}</p>
                    <p className="text-gray-600">{c.comment}</p>
                    <p className="text-gray-400 text-xs mt-1">{formatDate(c.createdAt)}</p>
                  </div>
                ))}
              </div>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-2"
              />
              <button
                onClick={addComment}
                className="px-4 py-2 rounded-xl bg-black text-white text-sm hover:bg-gray-800"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      </main>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Reject SOP</h3>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejection (required):</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 mb-4"
              placeholder="Rejection reason..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('reject')}
                disabled={!rejectReason.trim() || actionLoading}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
