import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import connectDB from '@/lib/db';
import SOP from '@/models/SOP';
import Department from '@/models/Department';
import { jsPDF } from 'jspdf';
import { logAudit } from '@/lib/audit';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await connectDB();
    const sop = await SOP.findById(id)
      .populate('author', 'username')
      .populate('department', 'name')
      .lean();

    if (!sop) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const userDeptIds = (session.user.departments || []).map((d) => (typeof d === 'object' ? d.id : d));
    const deptId = sop.department?._id?.toString();
    if (!session.user.roles?.includes('super_admin') && !userDeptIds.includes(deptId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text(sop.title, 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.text(`Department: ${sop.department?.name || ''} | Author: ${sop.author?.username || ''} | Version: ${sop.version} | Status: ${sop.status}`, 20, y);
    y += 15;

    doc.setFontSize(12);
    doc.text('Purpose', 20, y);
    y += 6;
    doc.setFontSize(10);
    const purposeLines = doc.splitTextToSize(sop.purpose || '', 170);
    doc.text(purposeLines, 20, y);
    y += purposeLines.length * 5 + 10;

    doc.setFontSize(12);
    doc.text('Scope', 20, y);
    y += 6;
    doc.setFontSize(10);
    const scopeLines = doc.splitTextToSize(sop.scope || '', 170);
    doc.text(scopeLines, 20, y);
    y += scopeLines.length * 5 + 10;

    doc.setFontSize(12);
    doc.text('Procedure', 20, y);
    y += 8;

    (sop.procedure || []).forEach((step, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.text(`Step ${step.stepNumber || i + 1}: ${step.title || 'Untitled'}`, 20, y);
      y += 5;
      const descLines = doc.splitTextToSize(step.description || '', 170);
      doc.text(descLines, 25, y);
      y += descLines.length * 5;
      (step.checklist || []).forEach((item) => {
        const text = typeof item === 'object' ? item.text : item;
        doc.text(`  • ${text}`, 25, y);
        y += 5;
      });
      y += 5;
    });

    await logAudit(session.user.id, 'export', 'SOP', sop._id, { title: sop.title }, request);

    const buf = Buffer.from(doc.output('arraybuffer'));
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SOP_${sop.title?.replace(/[^a-z0-9]/gi, '_')}.pdf"`,
      },
    });
  } catch (err) {
    console.error('Export PDF error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
