import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }
  return session;
}

export function hasRole(user, role) {
  return user?.roles?.includes(role) ?? false;
}

export function isSuperAdmin(user) {
  return hasRole(user, 'super_admin');
}

export function canAccessDepartment(user, departmentId) {
  if (isSuperAdmin(user)) return true;
  const deptIds = user?.departments?.map((d) => (typeof d === 'object' ? d._id?.toString() : d?.toString())) ?? [];
  return deptIds.includes(departmentId?.toString());
}
