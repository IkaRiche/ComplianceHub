import { jsPDF } from 'jspdf';
import { ValidationResult } from '@compliance-hub/shared';

export interface PDFGenerationOptions {
  filename?: string;
  includeDetailedErrors?: boolean;
  includeWarnings?: boolean;
}

// Helper to safely render text with UTF-8 characters
function safeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[""]/g, '"')    // Smart quotes to regular quotes
    .replace(/['']/g, "'")    // Smart apostrophes
    .replace(/–/g, '-')       // En dash to hyphen
    .replace(/—/g, '--')      // Em dash to double hyphen
    .replace(/…/g, '...')     // Ellipsis
    .replace(/✓/g, '[OK]')    // Check mark to [OK]
    .replace(/✗/g, '[X]')     // X mark to [X]
    .replace(/[^\x00-\x7F]/g, '?'); // Non-ASCII to ?
}

export function generateValidationPDF(
  result: ValidationResult,
  options: PDFGenerationOptions = {}
): void {
  const {
    filename = `vida-validation-report-${Date.now()}.pdf`,
    includeDetailedErrors = true,
    includeWarnings = true,
  } = options;

  try {
    const doc = new jsPDF();
    
    // Use Times font for better character support
    doc.setFont('times', 'normal');

    // Header
    doc.setFontSize(18);
    doc.setTextColor(44, 82, 130); // Primary blue
    doc.text(safeText('ViDA UBL Validation Report'), 20, 25);
    
    // Metadata
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, 20, 35);
    doc.text('Profile: EN 16931 v2 & Peppol BIS 4.0', 20, 42);
    doc.text('ComplianceHub • compliancehub.pages.dev', 20, 49);
    
    // Draw header line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 55, 190, 55);
    
    // Validation Status
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Validation Summary', 20, 70);
    
    // Status with color coding
    doc.setFontSize(12);
    const statusText = result.valid ? 'PASSED [OK]' : 'FAILED [X]';
    const statusColor = result.valid ? [34, 197, 94] : [239, 68, 68]; // Green or Red
    doc.setTextColor(...statusColor);
    doc.text(safeText(`Status: ${statusText}`), 20, 85);
    
    // Statistics
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    const errorCount = result.errors?.length || 0;
    const warningCount = result.warnings?.length || 0;
    const infoCount = result.infos?.length || 0;
    
    doc.text(`Errors: ${errorCount}`, 20, 100);
    doc.text(`Warnings: ${warningCount}`, 70, 100);
    doc.text(`Infos: ${infoCount}`, 120, 100);
    
    let currentY = 115;
    
    // ViDA Compliance Section
    if (result.vida) {
      doc.setFontSize(14);
      doc.text('ViDA Compliance Score', 20, currentY);
      currentY += 10;
      
      // Score with color coding
      doc.setFontSize(16);
      const score = result.vida.score || 0;
      const scoreColor = score >= 80 ? [34, 197, 94] : score >= 60 ? [251, 146, 60] : [239, 68, 68];
      doc.setTextColor(...scoreColor);
      doc.text(`${score}/100`, 20, currentY + 5);
      
      // Alignment status
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const alignmentText = result.vida.aligned ? '(ViDA Aligned [OK])' : '(Needs Improvement)';
      doc.text(safeText(alignmentText), 60, currentY + 5);
      
      currentY += 20;
      
      // ViDA Checklist - Simple text format
      if (result.vida.checklist && result.vida.checklist.length > 0) {
        doc.setFontSize(12);
        doc.text('ViDA Checklist', 20, currentY);
        currentY += 10;
        
        result.vida.checklist.forEach((item: any) => {
          const status = item.passed ? '[OK]' : '[X]';
          const color = item.passed ? [34, 197, 94] : [239, 68, 68];
          
          doc.setTextColor(...color);
          doc.setFontSize(10);
          doc.text(status, 20, currentY);
          
          doc.setTextColor(0, 0, 0);
          const title = safeText(item.title || 'Check');
          doc.text(title, 35, currentY);
          
          currentY += 8;
        });
        
        currentY += 10;
      }
    }
    
    // Detailed Issues Section
    if ((errorCount > 0 && includeDetailedErrors) || (warningCount > 0 && includeWarnings)) {
      // Check if we need a new page
      if (currentY > 240) {
        doc.addPage();
        currentY = 25;
      }
      
      doc.setFontSize(14);
      doc.text('Detailed Issues', 20, currentY);
      currentY += 15;
      
      // Errors
      if (errorCount > 0 && includeDetailedErrors) {
        doc.setFontSize(12);
        doc.setTextColor(239, 68, 68);
        doc.text(`Errors (${errorCount})`, 20, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 10;
        
        (result.errors || []).forEach((error: any, index: number) => {
          if (currentY > 270) {
            doc.addPage();
            currentY = 25;
          }
          
          doc.setFontSize(9);
          doc.setTextColor(200, 0, 0);
          doc.text(`${index + 1}.`, 20, currentY);
          
          doc.setTextColor(0, 0, 0);
          const ruleId = safeText(error.id || error.ruleId || 'N/A');
          const rulePath = safeText(error.path || 'N/A');
          doc.text(`Rule: ${ruleId} • Path: ${rulePath}`, 30, currentY);
          
          currentY += 6;
          
          const message = safeText(error.message || error.description || 'No description');
          const lines = doc.splitTextToSize(message, 160);
          doc.text(lines, 30, currentY);
          currentY += lines.length * 4 + 2;
          
          // Add hint if available
          if (error.hint) {
            doc.setFontSize(8);
            doc.setTextColor(0, 100, 0);
            const hint = safeText(`Fix: ${error.hint}`);
            const hintLines = doc.splitTextToSize(hint, 160);
            doc.text(hintLines, 30, currentY);
            currentY += hintLines.length * 3 + 2;
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
          }
        });
        
        currentY += 10;
      }
      
      // Warnings
      if (warningCount > 0 && includeWarnings) {
        if (currentY > 240) {
          doc.addPage();
          currentY = 25;
        }
        
        doc.setFontSize(12);
        doc.setTextColor(251, 146, 60);
        doc.text(`Warnings (${warningCount})`, 20, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 10;
        
        (result.warnings || []).forEach((warning: any, index: number) => {
          if (currentY > 270) {
            doc.addPage();
            currentY = 25;
          }
          
          doc.setFontSize(9);
          doc.setTextColor(200, 100, 0);
          doc.text(`${index + 1}.`, 20, currentY);
          
          doc.setTextColor(0, 0, 0);
          const ruleId = safeText(warning.id || warning.ruleId || 'N/A');
          const rulePath = safeText(warning.path || 'N/A');
          doc.text(`Rule: ${ruleId} • Path: ${rulePath}`, 30, currentY);
          
          currentY += 6;
          
          const message = safeText(warning.message || warning.description || 'No description');
          const lines = doc.splitTextToSize(message, 160);
          doc.text(lines, 30, currentY);
          currentY += lines.length * 4 + 2;
          
          // Add hint if available
          if (warning.hint) {
            doc.setFontSize(8);
            doc.setTextColor(0, 100, 0);
            const hint = safeText(`Fix: ${warning.hint}`);
            const hintLines = doc.splitTextToSize(hint, 160);
            doc.text(hintLines, 30, currentY);
            currentY += hintLines.length * 3 + 2;
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
          }
        });
      }
    }
    
    // Footer on all pages
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'ComplianceHub • ViDA UBL Validator • Generated by compliancehub.pages.dev',
        20,
        285
      );
      doc.text(`Page ${i} of ${pageCount}`, 170, 285);
    }
    
    // Save the PDF
    doc.save(filename);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    
    // Fallback: very simple PDF
    try {
      const doc = new jsPDF();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.text('ViDA UBL Validation Report', 20, 30);
      
      doc.setFontSize(12);
      doc.text(`Status: ${result.valid ? 'PASSED' : 'FAILED'}`, 20, 50);
      doc.text(`Errors: ${result.errors?.length || 0}`, 20, 65);
      doc.text(`Warnings: ${result.warnings?.length || 0}`, 20, 80);
      
      if (result.vida) {
        doc.text(`ViDA Score: ${result.vida.score || 0}/100`, 20, 100);
        doc.text(`ViDA Aligned: ${result.vida.aligned ? 'YES' : 'NO'}`, 20, 115);
      }
      
      if (result.errors?.length) {
        doc.text('Errors:', 20, 140);
        let y = 155;
        result.errors.slice(0, 5).forEach((error: any, i: number) => {
          const text = `${i + 1}. ${error.ruleId || 'N/A'}: ${error.message || 'No description'}`;
          const lines = doc.splitTextToSize(text, 170);
          doc.text(lines, 20, y);
          y += lines.length * 5 + 3;
        });
      }
      
      doc.text('Generated by ComplianceHub', 20, 270);
      doc.save(filename);
      
    } catch (fallbackError) {
      console.error('Even fallback PDF failed:', fallbackError);
      alert('PDF generation failed completely. Please download JSON instead.');
    }
  }
}