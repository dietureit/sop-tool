#!/usr/bin/env node
/**
 * Migration script: SopMaster-1 (SQLite) -> SOP Manager (MongoDB)
 * Usage: node scripts/migrate-from-sopmaster.mjs [--dry-run] [SQLITE_PATH]
 * Env: MONGODB_URI, SQLITE_PATH (default: ../SopMaster-1/sop.db)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import User from '../models/User';
import Department from '../models/Department';
import RoleDefinition from '../models/RoleDefinition';
import SOP from '../models/SOP';
import SOPVersion from '../models/SOPVersion';
import SOPComment from '../models/SOPComment';
import EditRequest from '../models/EditRequest';
import AuditLog from '../models/AuditLog';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const DRY_RUN = process.argv.includes('--dry-run');
const SQLITE_PATH = process.argv.find((a) => !a.startsWith('-') && a.endsWith('.db')) ||
  process.env.SQLITE_PATH ||
  join(__dirname, '..', '..', 'SopMaster-1', 'sop.db');

const idMap: Record<'department' | 'user' | 'role' | 'sop', Record<string, any>> = {
  department: {},
  user: {},
  role: {},
  sop: {},
};

function parseJson(s, def = []) {
  if (!s) return def;
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : def;
  } catch {
    return def;
  }
}

function parseProcedure(s) {
  const raw = parseJson(s, []);
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    if (typeof item === 'object' && item !== null) {
      const step = item;
      const checklist = Array.isArray(step.checklist)
        ? step.checklist.map((c) => (typeof c === 'object' && c?.text ? { text: c.text, isCompleted: false } : { text: String(c), isCompleted: false }))
        : [];
      return {
        stepNumber: step.stepNumber ?? i + 1,
        title: step.title || step.step || '',
        description: step.description || '',
        checklist,
        images: step.images || [],
        documents: step.documents || [],
      };
    }
    return { stepNumber: i + 1, title: '', description: String(item), checklist: [], images: [], documents: [] };
  });
}

function parseResponsibilities(s) {
  const raw = parseJson(s, []);
  return Array.isArray(raw)
    ? raw.map((r) => (typeof r === 'object' && r !== null ? { role: r.role || r.name || '', description: r.description || '' } : { role: String(r), description: '' }))
    : [];
}

async function run() {
  console.log('Migration: SopMaster-1 (SQLite) -> SOP Manager (MongoDB)');
  console.log('Dry run:', DRY_RUN);
  console.log('SQLite path:', SQLITE_PATH);

  if (!existsSync(SQLITE_PATH)) {
    console.error('SQLite database not found:', SQLITE_PATH);
    process.exit(1);
  }

  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sop-manager';

  if (!DRY_RUN) {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  }

  try {
    // 1. Departments (Flask-SQLAlchemy table: department)
    const deptRows: any[] = sqlite.prepare('SELECT id, name FROM department').all();
    console.log(`Departments: ${deptRows.length}`);
    if (!DRY_RUN) {
      for (const r of deptRows) {
        const doc = await Department.create({ name: r.name, description: '' });
        idMap.department[r.id] = doc._id;
      }
    } else {
      deptRows.forEach((r) => { idMap.department[r.id] = `dept_${r.id}`; });
    }

    // 2. Role definitions
    let roleRows: any[] = [];
    try {
      roleRows = sqlite.prepare('SELECT id, name, description, is_active FROM role_definition').all();
    } catch (_) {}
    console.log(`Role definitions: ${roleRows.length}`);
    if (!DRY_RUN) {
      for (const r of roleRows) {
        const doc = await RoleDefinition.create({
          name: r.name,
          description: r.description || '',
          isActive: r.is_active !== 0,
        });
        idMap.role[r.id] = doc._id;
      }
    }

    // 3. Users
    const userRows: any[] = sqlite.prepare('SELECT id, username, password_hash, role FROM user').all();
    console.log(`Users: ${userRows.length}`);
    const userDeptRows = [];
    try {
      userDeptRows.push(...sqlite.prepare('SELECT user_id, department_id FROM user_departments').all());
    } catch (_) {}
    if (!DRY_RUN) {
      for (const r of userRows) {
        const roles = (r.role || '').split(',').map((s) => s.trim()).filter(Boolean);
        const deptIds = userDeptRows.filter((ud) => ud.user_id === r.id).map((ud) => idMap.department[ud.department_id]).filter(Boolean);
        const doc = await User.create({
          username: r.username,
          email: `${r.username}@sopmanager.local`,
          passwordHash: r.password_hash,
          roles: roles.length ? roles : ['sop_writer'],
          departments: deptIds,
          isActive: true,
        });
        idMap.user[r.id] = doc._id;
      }
    }

    // 4. SOPs
    const sopRows: any[] = sqlite.prepare('SELECT * FROM sop').all();
    console.log(`SOPs: ${sopRows.length}`);
    if (!DRY_RUN) {
      for (const r of sopRows) {
        const deptId = idMap.department[r.department_id];
        const authorId = idMap.user[r.author_id];
        if (!deptId || !authorId) continue;
        const procedure = parseProcedure(r.procedure);
        const responsibilities = parseResponsibilities(r.responsibilities);
        const accountability = parseResponsibilities(r.accountability);
        const doc = await SOP.create({
          title: r.title,
          department: deptId,
          author: authorId,
          status: r.status || 'draft',
          purpose: r.purpose || '',
          scope: r.scope || '',
          procedure,
          responsibilities,
          accountability,
          exceptions: r.exceptions || '',
          version: r.version || 1,
          rejectionReason: r.rejection_reason,
          editPermission: r.edit_permission !== 0,
          approvedBy: r.approved_by_id ? idMap.user[r.approved_by_id] : undefined,
          approvedAt: r.approved_at ? new Date(r.approved_at) : undefined,
          submittedBy: r.submitted_by_id ? idMap.user[r.submitted_by_id] : undefined,
          submittedAt: r.submitted_at ? new Date(r.submitted_at) : undefined,
        });
        idMap.sop[r.id] = doc._id;
      }
    }

    // 5. SOP versions
    let verRows: any[] = [];
    try {
      verRows = sqlite.prepare('SELECT * FROM sop_version').all();
    } catch (_) {}
    console.log(`SOP versions: ${verRows.length}`);
    if (!DRY_RUN) {
      for (const r of verRows) {
        const sopId = idMap.sop[r.sop_id];
        if (!sopId) continue;
        await SOPVersion.create({
          sop: sopId,
          versionNumber: r.version_number,
          title: r.title,
          purpose: r.purpose || '',
          scope: r.scope || '',
          procedure: parseProcedure(r.procedure),
          responsibilities: parseResponsibilities(r.responsibilities),
          accountability: parseResponsibilities(r.accountability),
          exceptions: r.exceptions || '',
          createdAt: r.created_at ? new Date(r.created_at) : new Date(),
        });
      }
    }

    // 6. SOP comments
    let commentRows: any[] = [];
    try {
      commentRows = sqlite.prepare('SELECT * FROM sop_comment').all();
    } catch (_) {}
    console.log(`SOP comments: ${commentRows.length}`);
    if (!DRY_RUN) {
      for (const c of commentRows) {
        const sopId = idMap.sop[c.sop_id];
        const userId = idMap.user[c.user_id];
        if (!sopId || !userId) continue;
        await SOPComment.create({ sop: sopId, user: userId, comment: c.comment });
      }
    }

    // 7. Edit requests
    let erRows = [];
    try {
      erRows = sqlite.prepare('SELECT * FROM edit_request').all();
    } catch (_) {}
    console.log(`Edit requests: ${erRows.length}`);
    if (!DRY_RUN) {
      for (const r of erRows) {
        const sopId = idMap.sop[r.sop_id];
        const requesterId = idMap.user[r.requester_id];
        if (!sopId || !requesterId) continue;
        await EditRequest.create({
          sop: sopId,
          requester: requesterId,
          approver: r.approver_id ? idMap.user[r.approver_id] : undefined,
          status: r.status || 'pending',
          reason: r.reason,
          responseMessage: r.response_message,
        });
      }
    }

    // 8. Audit logs
    let auditRows: any[] = [];
    try {
      auditRows = sqlite.prepare('SELECT * FROM audit_logs').all();
    } catch (_) {}
    console.log(`Audit logs: ${auditRows.length}`);
    if (!DRY_RUN) {
      for (const r of auditRows) {
        const userId = idMap.user[r.user_id];
        if (!userId) continue;
        let resourceId = null;
        if (r.resource_type === 'SOP' && r.resource_id) resourceId = idMap.sop[r.resource_id];
        else if (r.resource_type === 'User' && r.resource_id) resourceId = idMap.user[r.resource_id];
        await AuditLog.create({
          user: userId,
          action: r.action || 'update',
          resourceType: r.resource_type || 'SOP',
          resourceId,
          details: r.details,
          ipAddress: r.ip_address,
          userAgent: r.user_agent,
          timestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
        });
      }
    }

    // 9. Copy uploads
    const srcUploads = join(__dirname, '..', '..', 'SopMaster-1', 'static', 'uploads');
    const dstUploads = join(__dirname, '..', 'public', 'uploads');
    if (existsSync(srcUploads) && !DRY_RUN) {
      mkdirSync(dstUploads, { recursive: true });
      const copyDir = (src, dst) => {
        const entries = readdirSync(src, { withFileTypes: true });
        for (const e of entries) {
          const s = join(src, e.name);
          const d = join(dst, e.name);
          if (e.isDirectory()) {
            mkdirSync(d, { recursive: true });
            copyDir(s, d);
          } else {
            copyFileSync(s, d);
          }
        }
      };
      copyDir(srcUploads, dstUploads);
      console.log('Copied uploads');
    }

    console.log('Migration completed successfully.');
  } finally {
    sqlite.close();
    if (!DRY_RUN) await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
