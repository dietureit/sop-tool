'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });
      if (res?.error) {
        console.log(res.error);
        setError('Invalid username or password');
        setLoading(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <h1 className="text-2xl font-semibold text-[#111827] mb-2 text-center">SOP Manager</h1>
          <p className="text-gray-500 text-sm text-center mb-8">Sign in to your account</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#374151] mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#111827] focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300"
                placeholder="Enter username"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#374151] mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#111827] focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-300"
                placeholder="Enter password"
                required
                autoComplete="current-password"
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-pulse">Loading...</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
