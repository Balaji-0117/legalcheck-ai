/**
 * Report Controller
 * Generates official PDF inspection reports under Legal Metrology Rules for enforcement officers.
 */

const PDFDocument = require('pdfkit');
const db = require('../models/db');

function generatePdfReport(req, res) {
  try {
    const scanId = req.params.id;
    const scan = db.getScanById(scanId);

    if (!scan) {
      return res.status(404).send('Scan ID not found');
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=LegalCheck_Inspection_Report_${scanId}.pdf`);

    doc.pipe(res);

    // Official Header
    doc.fillColor('#12355B').fontSize(18).text('GOVERNMENT OF INDIA', { align: 'center' });
    doc.fontSize(14).text('DEPARTMENT OF CONSUMER AFFAIRS', { align: 'center' });
    doc.fontSize(12).fillColor('#F59E0B').text('LEGAL METROLOGY DIVISION - PACKAGED COMMODITIES INSPECTION REPORT', { align: 'center' });
    doc.moveDown(1);
    doc.strokeColor('#12355B').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Inspection Metadata Table
    doc.fillColor('#0F172A').fontSize(11);
    doc.text(`Scan ID: ${scan.id}`);
    doc.text(`Date & Time: ${new Date(scan.created_at).toLocaleString()}`);
    doc.text(`Product Name: ${scan.product_name || 'N/A'}`);
    doc.text(`Compliance Score: ${scan.score}%`);
    
    const statusColor = scan.status === 'COMPLIANT' ? '#16A34A' : '#DC2626';
    doc.fillColor(statusColor).text(`Overall Status: ${scan.status}`);
    doc.moveDown(1);

    // Violations Section
    doc.fillColor('#12355B').fontSize(13).text('VIOLATIONS & NON-COMPLIANCE FINDINGS', { underline: true });
    doc.moveDown(0.5);

    if (scan.violations && scan.violations.length > 0) {
      scan.violations.forEach((vio, idx) => {
        doc.fillColor('#DC2626').fontSize(11).text(`${idx + 1}. [${vio.severity || 'HIGH'}] ${vio.name || vio.field || 'Violation'}`);
        doc.fillColor('#475569').fontSize(10).text(`   Rule: ${vio.legalSource || vio.rule_id || 'LMPC Rule 6'}`);
        doc.text(`   Reason: ${vio.reason}`);
        if (vio.officerAction) {
          doc.fillColor('#12355B').text(`   Officer Recommendation: ${vio.officerAction}`);
        }
        doc.moveDown(0.5);
      });
    } else {
      doc.fillColor('#16A34A').fontSize(11).text('No legal metrology violations detected. Mandatory declarations are compliant.');
      doc.moveDown(0.5);
    }

    // Extracted Declarations
    doc.moveDown(1);
    doc.fillColor('#12355B').fontSize(13).text('EXTRACTED MANDATORY DECLARATIONS', { underline: true });
    doc.moveDown(0.5);

    const fields = scan.extracted_data || scan.fields || {};
    Object.entries(fields).forEach(([k, v]) => {
      if (v) {
        doc.fillColor('#0F172A').fontSize(10).text(`• ${k.replace(/_/g, ' ').toUpperCase()}: ${v}`);
      }
    });

    // Disclaimer & Sign-off
    doc.moveDown(2);
    doc.fillColor('#64748B').fontSize(9).text('Notice: Prototype-based automated compliance screening against selected applicable LMPC requirements.', { align: 'center' });
    doc.moveDown(1);
    doc.fillColor('#12355B').fontSize(10).text('Authorized Legal Metrology Officer Signature: _______________________', { align: 'right' });

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).send('Error generating PDF report: ' + error.message);
  }
}

module.exports = {
  generatePdfReport
};
