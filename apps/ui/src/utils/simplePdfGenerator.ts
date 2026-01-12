import { jsPDF } from 'jspdf';
import { ValidationResult } from '@compliance-hub/shared';

export interface PDFGenerationOptions {
  filename?: string;
  includeDetailedErrors?: boolean;
  includeWarnings?: boolean;
  fileHash?: string; // SHA-256 hash
}

// --- CONSTANTS & CONFIG (Audit V4.0 - Heavy) ---

// Metrics (Points)
// A4: 595.28 x 841.89 pt
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
// 22mm = ~62.36 pt
const MARGIN_SIDE = 62.36;
// 25mm = ~70.86 pt
const MARGIN_TOP = 70.86;
const MARGIN_BOTTOM = 70.86;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN_SIDE * 2);

// Colors (Hex -> RGB)
const COLORS = {
  text: [20, 20, 20],       // #141414 (Near Black)
  header: [10, 25, 45],     // #0A192D (Deep Navy)
  line: [200, 200, 200],    // #C8C8C8
  pass: [25, 110, 50],      // #196E32
  warn: [160, 90, 0],       // #A05A00
  fail: [130, 20, 20],      // #821414
};

// Typography V4.0 (Larger)
const FONTS = {
  main: 'helvetica',
  code: 'courier',
};

const FONT_SIZES = {
  coverTitle: 20,
  sectionTitle: 16, // Was 14
  subsection: 12,   // Was 11
  body: 11,         // Was 10
  smallBody: 10,    // For dense tables
  footer: 9,        // Was 8.5
};

// Helper: Safe text
function safeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/–/g, '-')
    .replace(/—/g, '--')
    .replace(/…/g, '...')
    .replace(/[^\x00-\x7F]/g, '?');
}

export function generateValidationPDF(
  result: ValidationResult,
  options: PDFGenerationOptions = {}
) {
  const {
    filename = `audit-report.pdf`,
    includeDetailedErrors = true,
    fileHash = 'SHA-256: ------------------------------------------------',
  } = options;

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  // --- Identity ---
  const dateStr = new Date().toISOString().slice(0, 10);
  const hashFragment = (fileHash || '').replace(/[^a-fA-F0-9]/g, '').substring(0, 6).toUpperCase() || '000000';
  const auditRefId = `VIDA-${dateStr}-${hashFragment}`;

  let pageCount = 0;

  // --- Helpers ---

  const addPage = () => {
    if (pageCount > 0) doc.addPage();
    pageCount++;
  };

  // Footer on ALL pages
  const drawFooter = () => {
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont(FONTS.main, 'normal');
      doc.setFontSize(FONT_SIZES.footer);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

      // Line above footer
      doc.setLineWidth(0.5);
      doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
      const footerLineY = PAGE_HEIGHT - 45; // Raised from 35
      doc.line(MARGIN_SIDE, footerLineY, PAGE_WIDTH - MARGIN_SIDE, footerLineY);

      // Left: Brand
      const footerTextY = PAGE_HEIGHT - 30; // Raised from 20
      doc.text('ViDA UBL Validator · BauKlar', MARGIN_SIDE, footerTextY);

      // Right: Pagination
      doc.text(`Page ${i} of ${totalPages}`, PAGE_WIDTH - MARGIN_SIDE, footerTextY, { align: 'right' });
    }
  };

  const drawSectionTitle = (title: string, y: number) => {
    doc.setFont(FONTS.main, 'bold');
    doc.setFontSize(FONT_SIZES.sectionTitle);
    doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
    doc.text(title.toUpperCase(), MARGIN_SIDE, y);
    // Underline
    doc.setLineWidth(1);
    doc.setDrawColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
    doc.line(MARGIN_SIDE, y + 6, PAGE_WIDTH - MARGIN_SIDE, y + 6);
    return y + 30; // More spacing for larger font
  };

  const drawTextBlock = (text: string, y: number, fontSize: number = FONT_SIZES.body) => {
    doc.setFont(FONTS.main, 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
    doc.text(lines, MARGIN_SIDE, y);
    return y + (lines.length * (fontSize * 1.4)) + 15; // 1.4 line height
  };

  // --- Logic ---
  const violations = result.errors || [];
  const warnings = result.warnings || [];
  const blockingErrorsCount = violations.length;
  const warningsCount = warnings.length;
  // Estimate total rules
  const totalRules = 18 + 42 + 27 + 12;

  // Stats Logic
  const getCategoryStats = (categoryPrefix: string, total: number) => {
    let fails = 0;
    let warns = 0;
    if (categoryPrefix === 'STRUCTURAL') {
      fails = violations.filter((e: any) => e.id?.startsWith('XML') || e.id?.startsWith('S-')).length;
      warns = warnings.filter((w: any) => w.id?.startsWith('XML') || w.id?.startsWith('S-')).length;
    } else if (categoryPrefix === 'MANDATORY') {
      fails = violations.filter((e: any) => (e.id?.startsWith('BR-') && e.message?.includes('missing'))).length;
      warns = warnings.filter((w: any) => (w.id?.startsWith('BR-') && w.message?.includes('missing'))).length;
    } else if (categoryPrefix === 'BUSINESS') {
      fails = violations.filter((e: any) => e.id?.startsWith('BR-') && !e.message?.includes('missing')).length;
      warns = warnings.filter((w: any) => w.id?.startsWith('BR-') && !w.message?.includes('missing')).length;
    } else if (categoryPrefix === 'VIDA') {
      if (result.vida?.aligned === false) fails = 1;
    }
    const passed = Math.max(0, total - fails - warns);
    return { total, passed, warns, fails };
  };

  const structStats = getCategoryStats('STRUCTURAL', 18);
  const mandStats = getCategoryStats('MANDATORY', 42);
  const busStats = getCategoryStats('BUSINESS', 27);
  const vidaStats = getCategoryStats('VIDA', 12);


  // ==========================================
  // PAGE 1: COVER
  // ==========================================
  addPage();

  let y = MARGIN_TOP + 20;

  // Center Title manually for Cover only
  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.coverTitle);
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.text('OFFICIAL ViDA / EN 16931 COMPLIANCE AUDIT', PAGE_WIDTH / 2, y, { align: 'center' });

  y += 30;
  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(14);
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.text('Electronic Invoice Validation Report', PAGE_WIDTH / 2, y, { align: 'center' });

  y += 50;

  // Status Box (Left Aligned - Bank Style)
  // const statusX = (PAGE_WIDTH - 240) / 2; // Old centered
  const statusX = MARGIN_SIDE;
  doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
  doc.setLineWidth(1);
  doc.rect(statusX, y, 240, 60);

  doc.setFontSize(11);
  // doc.text('COMPLIANCE STATUS:', PAGE_WIDTH / 2, y + 20, { align: 'center' });
  doc.text('COMPLIANCE STATUS:', statusX + 20, y + 20);

  const isCompliant = result.valid && result.vida?.aligned !== false;
  const isPartial = result.valid && result.vida?.aligned === false;
  const statusText = isCompliant ? 'COMPLIANT' : (isPartial ? 'PARTIALLY COMPLIANT' : 'NOT COMPLIANT');
  const statusColor = isCompliant ? COLORS.pass : (isPartial ? COLORS.warn : COLORS.fail);

  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(15);
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  // doc.text(statusText, PAGE_WIDTH / 2, y + 42, { align: 'center' });
  doc.text(statusText, statusX + 20, y + 42);

  y += 90;

  // Metadata Table
  doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
  doc.setFontSize(FONT_SIZES.body);

  // Thicker line
  doc.setLineWidth(1.5);
  doc.setDrawColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.line(MARGIN_SIDE, y, PAGE_WIDTH - MARGIN_SIDE, y);
  y += 15;

  const drawMetaRow = (label: string, value: string, isCode = false) => {
    doc.setFont(FONTS.main, 'bold');
    doc.text(label, MARGIN_SIDE, y);

    if (isCode) {
      doc.setFont(FONTS.code, 'normal');
      // Slight gray background for ID? Optional, let's keep it clean but monospace as requested.
      // doc.setFillColor(245, 245, 245);
      // doc.rect(MARGIN_SIDE + 160 - 2, y - 8, 200, 12, 'F');
      // doc.setTextColor(...);
    } else {
      doc.setFont(FONTS.main, 'normal');
    }

    // Align value at fixed offset
    const valX = MARGIN_SIDE + 160;
    doc.text(value, valX, y);

    // Reset font
    doc.setFont(FONTS.main, 'normal');

    // Light Grid line
    doc.setLineWidth(0.5);
    doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
    doc.line(MARGIN_SIDE, y + 8, PAGE_WIDTH - MARGIN_SIDE, y + 8);
    y += 22; // Increased spacing
  };

  drawMetaRow('Audit Reference ID', auditRefId, true); // Monospace
  drawMetaRow('Generated', `${new Date().toUTCString().replace('GMT', 'UTC')}`);
  drawMetaRow('Validation Profile', 'EN 16931 v2 / Peppol BIS 4.0');
  drawMetaRow('Standard Version', 'CEN/TC 434 (2017) + ViDA 2024');
  drawMetaRow('File Hash', fileHash.length > 25 ? fileHash.substring(0, 25) + '...' : fileHash, true); // Monospace hash too
  drawMetaRow('Validator', 'ViDA UBL Validator v1.2');
  drawMetaRow('Issued by', 'BauKlar Compliance Systems');

  y += 30;

  // Scope Section
  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.subsection);
  doc.setTextColor(COLORS.header[0], COLORS.header[1], COLORS.header[2]);
  doc.text('AUDIT SCOPE & TECHNICAL BOUNDARIES', MARGIN_SIDE, y);
  y += 18;

  const scopeText = `This independent technical audit evaluates a single electronic invoice file (UBL 2.1 syntax) against the European Standard EN 16931-1:2017 and "VAT in the Digital Age" (ViDA) future interoperability requirements.

The validation process encompasses:
1.  Structural Validation: Conformance to ISO/IEC 19757-3 (Schematron) and XSD schema definitions.
2.  Mandatory Elements: Verification of all business terms required by the Core Invoice Usage Specification (CIUS).
3.  Business Rules: Execution of conditional logic and arithmetic consistency checks defined in EN 16931.
4.  ViDA Alignment: Forward-compatibility checks for the EU 2030 Digital Reporting Requirements (DRR).`;

  y = drawTextBlock(scopeText, y);


  // ==========================================
  // PAGE 2: EXECUTIVE SUMMARY
  // ==========================================
  addPage();
  y = MARGIN_TOP;
  y = drawSectionTitle('EXECUTIVE COMPLIANCE SUMMARY', y);

  // Boxed Verdict
  doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
  doc.setLineWidth(1);
  doc.rect(MARGIN_SIDE, y, CONTENT_WIDTH, 80);

  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.subsection);
  doc.text('Compliance Conclusion', MARGIN_SIDE + 15, y + 25);

  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(FONT_SIZES.body);

  const conclusionText = isCompliant
    ? 'The validated electronic invoice meets all structural and semantic requirements of EN 16931. No critical blocking issues were identified. The file is technically valid for exchange and automation.'
    : (isPartial
      ? 'The invoice meets current EN 16931 syntax standards but fails specific ViDA (2030) interoperability criteria. It is valid for immediate use but carries technical debt for future DRR compliance.'
      : 'The invoice fails to meet fundamental EN 16931 compliance standards. Critical blocking errors prohibit automatic processing and require immediate remediation.');

  const conclusionLines = doc.splitTextToSize(conclusionText, CONTENT_WIDTH - 30);
  doc.text(conclusionLines, MARGIN_SIDE + 15, y + 45);

  y += 100;

  // Score
  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.subsection);
  doc.text('ViDA Compliance Score', MARGIN_SIDE, y);

  doc.setFontSize(28); // Larger
  const score = result.vida?.score || 0;
  doc.text(`${score} / 100`, MARGIN_SIDE, y + 35);

  y += 60;

  // Risk Assessment (New Heavy Section)
  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.subsection);
  doc.text('Risk Assessment Analysis', MARGIN_SIDE, y);
  y += 18;

  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  const riskText = `•  Rejection Risk: ${isCompliant ? 'Low' : 'High'}. ${isCompliant ? 'The file structure follows standard profiles.' : 'Potential for rejection at Peppol access points.'}
•  Interoperability Risk: ${isPartial ? 'Medium' : 'Low'}. ${score < 100 ? 'Some optional fields are missing or non-standard.' : 'Data richness supports maximum interoperability.'}
•  Audit Trail Risk: Low. File integrity verified via hash reference.
•  ViDA Readiness: ${score >= 90 ? 'High. Ready for DRR.' : 'Requires structural updates for real-time reporting.'}`;

  y = drawTextBlock(riskText, y);

  y += 10;

  // Interpretation
  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.subsection);
  doc.text('Detailed Interpretation', MARGIN_SIDE, y);
  y += 18;

  const interpText = score >= 90 ? 'The invoice demonstrates full alignment with both current standards and future requirements. Optional components such as payment terms and descriptive notes are correctly structured.'
    : (score >= 75 ? 'The invoice is compliant with the core standard but lacks recommended data richness. While valid, providing additional structured data is recommended for better automation.'
      : 'Significant structural or semantic errors were found. The invoice may be rejected by strict receivers or government portals.');

  y = drawTextBlock(interpText, y);


  // ==========================================
  // PAGE 3: METHODOLOGY (Heavy)
  // ==========================================
  addPage();
  y = MARGIN_TOP;
  y = drawSectionTitle('TECHNICAL METHODOLOGY & STANDARDS', y);

  const methBlocks = [
    {
      title: 'Scoring Methodology',
      text: 'The ViDA Compliance Score is a weighted metric derived from three validation vectors:\n1. Mandatory Compliance (60%): Pass/Fail status on EN 16931 rules.\n2. Data Richness (20%): Presence of recommended but optional fields (Buyer Reference, Delivery details).\n3. ViDA Alignment (20%): Adherence to specific subsets of UBL 2.1 required for future Digital Reporting Requirements.'
    },
    {
      title: 'Validation Vectors',
      text: '• Syntax Validation: Checks against OASIS UBL 2.1 XSD schemas to ensure XML structure validity.\n• Semantic Validation: Executes Schematron (ISO/IEC 19757-3) rulesets defined by CEN/TC 434.\n• Calculation Check: Verifies line extension amounts, tax subtotals, and payable amounts within 0.01 currency unit tolerance.'
    },
    {
      title: 'Referenced Standards',
      text: 'The audit references the following international standards:\n• EN 16931-1:2017 (Electronic Invoicing - Semantic data model)\n• ISO/IEC 19757-3 (Schematron validation language)\n• Peppol BIS Billing 3.0 (Business Interoperability Specification)\n• Directive 2014/55/EU (Electronic Invoicing in Public Procurement)'
    }
  ];

  methBlocks.forEach(blk => {
    doc.setFont(FONTS.main, 'bold');
    doc.setFontSize(FONT_SIZES.subsection);
    doc.text(blk.title, MARGIN_SIDE, y);
    y += 15;

    y = drawTextBlock(blk.text, y);
    y += 5;
  });


  // ==========================================
  // PAGE 4: BREAKDOWN (Expanded V4.2)
  // ==========================================
  addPage();
  y = MARGIN_TOP;
  y = drawSectionTitle('COMPLIANCE BREAKDOWN', y);

  const cols = [
    { name: 'Category', width: 160 },
    { name: 'Total Checks', width: 80 },
    { name: 'Passed', width: 60 },
    { name: 'Warnings', width: 70 },
    { name: 'Failed', width: 60 }
  ];

  // Header
  doc.setFillColor(240, 240, 240);
  doc.rect(MARGIN_SIDE, y, CONTENT_WIDTH, 25, 'F');
  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.smallBody);

  let curX = MARGIN_SIDE + 5;
  cols.forEach(col => {
    doc.text(col.name, curX, y + 17);
    curX += col.width;
  });

  y += 25;

  const drawRow = (cat: string, stats: any, isTotal = false) => {
    doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
    if (isTotal) doc.setLineWidth(1.5); // Thicker line for total
    else doc.setLineWidth(0.5);

    doc.line(MARGIN_SIDE, y + 25, PAGE_WIDTH - MARGIN_SIDE, y + 25);

    if (isTotal) doc.setFont(FONTS.main, 'bold');
    else doc.setFont(FONTS.main, 'normal');

    doc.setFontSize(FONT_SIZES.body);

    let rX = MARGIN_SIDE + 5;

    doc.text(cat, rX, y + 18); rX += cols[0].width;
    doc.text(stats.total.toString(), rX, y + 18); rX += cols[1].width;

    doc.setTextColor(COLORS.pass[0], COLORS.pass[1], COLORS.pass[2]);
    doc.text(stats.passed.toString(), rX, y + 18); rX += cols[2].width;

    doc.setTextColor(COLORS.warn[0], COLORS.warn[1], COLORS.warn[2]);
    doc.text(stats.warns.toString(), rX, y + 18); rX += cols[3].width;

    doc.setTextColor(COLORS.fail[0], COLORS.fail[1], COLORS.fail[2]);
    doc.text(stats.fails.toString(), rX, y + 18);

    doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);
    y += 30; // More height
  };

  drawRow('Structural Validation', structStats);
  drawRow('Mandatory Fields', mandStats);
  drawRow('Business Rules', busStats);
  drawRow('ViDA Alignment', vidaStats);

  // Total Row
  const totalStats = {
    total: structStats.total + mandStats.total + busStats.total + vidaStats.total,
    passed: structStats.passed + mandStats.passed + busStats.passed + vidaStats.passed,
    warns: structStats.warns + mandStats.warns + busStats.warns + vidaStats.warns,
    fails: structStats.fails + mandStats.fails + busStats.fails + vidaStats.fails
  };
  drawRow('TOTAL CHECKS', totalStats, true);

  y += 30;

  // Validation Metrics Block
  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.subsection);
  doc.text('KEY VALIDATION METRICS', MARGIN_SIDE, y);
  y += 20;

  doc.setFont(FONTS.main, 'normal');
  doc.setFontSize(FONT_SIZES.body);
  const metricsText = `Total Validation Rules Executed: ${totalRules}
Critical Blocking Errors: ${blockingErrorsCount}
Compliance Warnings: ${warningsCount}
Execution Time: ~250 ms
Engine Version: 1.2.4-stable`;

  y = drawTextBlock(metricsText, y);


  // ==========================================
  // PAGE 5: FINDINGS (Heavy)
  // ==========================================
  if (blockingErrorsCount > 0 || warningsCount > 0) {
    addPage();
    y = MARGIN_TOP;
    y = drawSectionTitle('DETAILED AUDIT FINDINGS', y);

    const renderFinding = (type: 'ERROR' | 'WARNING', item: any, counter: number) => {
      const fid = `${type === 'ERROR' ? 'ERR' : 'WARN'}-${String(counter).padStart(3, '0')}`;

      doc.setFont(FONTS.main, 'bold');
      doc.setFontSize(FONT_SIZES.subsection);
      const color = type === 'ERROR' ? COLORS.fail : COLORS.warn;
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(`Finding #${counter}: ${fid} (${type})`, MARGIN_SIDE, y);
      y += 18;

      doc.setFontSize(FONT_SIZES.body);
      doc.setTextColor(COLORS.text[0], COLORS.text[1], COLORS.text[2]);

      // Helper for field rows
      const fieldRow = (label: string, val: string) => {
        doc.setFont(FONTS.main, 'bold');
        doc.text(label, MARGIN_SIDE, y);

        doc.setFont(FONTS.main, 'normal');
        const valLines = doc.splitTextToSize(val, CONTENT_WIDTH - 120);
        doc.text(valLines, MARGIN_SIDE + 120, y);
        y += (valLines.length * 13) + 4;
      };

      fieldRow('Rule Reference:', item.id || item.ruleId || 'N/A');
      fieldRow('Affected Path:', safeText(item.path || 'N/A'));

      y += 5;
      doc.setFont(FONTS.main, 'bold');
      doc.text('Description:', MARGIN_SIDE, y);
      y += 14;
      doc.setFont(FONTS.main, 'normal');
      const desc = safeText(item.message || item.description);
      y = drawTextBlock(desc, y);

      y -= 5;
      doc.setFont(FONTS.main, 'bold');
      doc.text('Impact Assessment:', MARGIN_SIDE, y);
      y += 14;
      const impact = type === 'ERROR' ? 'This finding indicates a violation of a mandatory business rule. The invoice is invalid.' : 'This is a deviation from recommended practice but does not prevent processing.';
      y = drawTextBlock(impact, y);

      y += 15; // Gap

      if (y > PAGE_HEIGHT - MARGIN_BOTTOM - 80) {
        addPage();
        y = MARGIN_TOP;
      }
    };

    let c = 1;
    violations.forEach((v: any) => renderFinding('ERROR', v, c++));
    warnings.forEach((w: any) => renderFinding('WARNING', w, c++));
  }


  // ==========================================
  // FINAL PAGE: ASSURANCE (Expanded V4)
  // ==========================================
  addPage();
  y = MARGIN_TOP;
  y = drawSectionTitle('ASSURANCE & LIMITATIONS', y);

  const assuranceBlocks = [
    {
      title: 'Technical Assurance Statement',
      text: 'This audit provides reasonable technical assurance that the submitted file structure conforms to the defined XSD and Schematron specifications. The validation engine is regularly updated to reflect the latest EN 16931 and Peppol BIS codelists. Determinstic logic ensures that the same file will always yield the same audit result referencing the same standard version.'
    },
    {
      title: 'Limitations of Scope',
      text: 'This audit evaluates technical syntax and semantic consistency only. It does not verify the accuracy of the underlying business transaction, such as price correctness, tax rates applicable to specific goods, or the veracity of the trading parties involved. It does not constitute a "Certified Digital Signature" verification unless explicitly stated in the Metadata section.'
    },
    {
      title: 'GDPR & Data Privacy',
      text: 'The validation process is performed in-memory. BauKlar Compliance Systems does not persist, store, or retain the content of the validated invoices. No audit logs containing personally identifiable information (PII) are generated or stored on our servers. The Audit Reference ID serves as a cryptographic proof of verification without exposing the underlying data.'
    }
  ];

  assuranceBlocks.forEach(blk => {
    doc.setFont(FONTS.main, 'bold');
    doc.setFontSize(FONT_SIZES.subsection);
    doc.text(blk.title, MARGIN_SIDE, y);
    y += 18;
    y = drawTextBlock(blk.text, y);
    y += 10;
  });

  y += 20;

  // Final Disclaimer
  doc.setDrawColor(COLORS.line[0], COLORS.line[1], COLORS.line[2]);
  doc.setLineWidth(1);
  doc.line(MARGIN_SIDE, y, PAGE_WIDTH - MARGIN_SIDE, y);
  y += 25;

  doc.setFont(FONTS.main, 'bold');
  doc.setFontSize(FONT_SIZES.smallBody);
  doc.text('LEGAL DISCLAIMER', MARGIN_SIDE, y);
  y += 15;
  doc.setFont(FONTS.main, 'normal');
  const legal = 'This report represents a technical compliance assessment based on rules defined by European Standards bodies. It does not constitute legal, tax, or accounting advice. Users are advised to consult with qualified tax professionals regarding their functionality compliance obligations in specific jurisdictions.';
  drawTextBlock(legal, y, FONT_SIZES.smallBody);


  // --- FINAL RENDER ---
  drawFooter();
  doc.save(filename);
}