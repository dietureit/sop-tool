import connectDB from '@/lib/db';
import AuditLog from '@/models/AuditLog';

export async function logAudit(userId, action, resourceType, resourceId = null, details = null, req = null) {
  try {
    await connectDB();
    await AuditLog.create({
      user: userId,
      action,
      resourceType,
      resourceId,
      details: typeof details === 'object' ? JSON.stringify(details) : details,
      ipAddress: req?.headers?.get?.('x-forwarded-for')?.split(',')[0] || req?.headers?.get?.('x-real-ip'),
      userAgent: req?.headers?.get?.('user-agent'),
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
