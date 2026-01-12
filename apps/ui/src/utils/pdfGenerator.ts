import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { ValidationResult } from '@compliance-hub/shared';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

// Enhanced text rendering with proper UTF-8 support
// Using a combination of built-in fonts and text encoding fixes
function setupPDFFont(doc: jsPDF): void {
  try {
    // Use Times font which has better UTF-8 support than Helvetica
    doc.setFont('times', 'normal');
  } catch (error) {
    console.warn('Font setup failed, using default:', error);
    doc.setFont('helvetica', 'normal');
  }
}

// Helper to safely render text with UTF-8 characters
function safeText(text: string): string {
  // Replace common problematic characters with safe alternatives
  return text
    .replace(/[""]/g, '"')  // Smart quotes to regular quotes
    .replace(/['']/g, "'")  // Smart apostrophes
    .replace(/–/g, '-')     // En dash to hyphen
    .replace(/—/g, '--')    // Em dash to double hyphen
    .replace(/…/g, '...')   // Ellipsis
    .replace(/[^\x00-\x7F]/g, '?'); // Replace any non-ASCII with ?
}

export interface PDFGenerationOptions {
  filename?: string;
  includeDetailedErrors?: boolean;
  includeWarnings?: boolean;
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
    
    // Setup font for better character support
    setupPDFFont(doc);

    // Header
    doc.setFontSize(18);
    doc.setTextColor(44, 82, 130); // Primary color
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
      
      // ViDA Checklist Table
      if (result.vida.checklist && result.vida.checklist.length > 0) {
        doc.setFontSize(12);
        doc.text('ViDA Checklist', 20, currentY);
        currentY += 5;
        
        const checklistData = result.vida.checklist.map((item: any) => [
          safeText(item.title || 'Check'),
          item.passed ? '[OK] PASS' : '[X] FAIL',
          safeText(item.description || '')
        ]);
        
        doc.autoTable({
          startY: currentY,
          head: [['Check', 'Status', 'Description']],
          body: checklistData,
          theme: 'striped',
          styles: {
            fontSize: 8,
            cellPadding: 3,
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: [241, 245, 249],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 25, halign: 'center' },
            2: { cellWidth: 95 },
          },
        });
        
        currentY = doc.lastAutoTable.finalY + 15;
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
      currentY += 10;
      
      // Errors Table
      if (errorCount > 0 && includeDetailedErrors) {
        doc.setFontSize(12);
        doc.setTextColor(239, 68, 68);
        doc.text(`Errors (${errorCount})`, 20, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 5;
        
        const errorData = (result.errors || []).map((error: any) => [
          safeText(error.ruleId || 'N/A'),
          safeText(error.message || error.description || 'No description'),
          safeText(error.hint || error.suggestion || '')
        ]);
        
        doc.autoTable({
          startY: currentY,
          head: [['Rule ID', 'Issue Description', 'Recommendation']],
          body: errorData,
          theme: 'striped',
          styles: {
            fontSize: 7,
            cellPadding: 2,
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: [254, 242, 242],
            textColor: [153, 27, 27],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 35, fontStyle: 'bold' },
            1: { cellWidth: 90 },
            2: { cellWidth: 55 },
          },
        });
        
        currentY = doc.lastAutoTable.finalY + 10;
      }
      
      // Warnings Table
      if (warningCount > 0 && includeWarnings && currentY < 250) {
        doc.setFontSize(12);
        doc.setTextColor(251, 146, 60);
        doc.text(`Warnings (${warningCount})`, 20, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += 5;
        
        const warningData = (result.warnings || []).map((warning: any) => [
          safeText(warning.ruleId || 'N/A'),
          safeText(warning.message || warning.description || 'No description'),
          safeText(warning.hint || warning.suggestion || '')
        ]);
        
        doc.autoTable({
          startY: currentY,
          head: [['Rule ID', 'Warning Description', 'Recommendation']],
          body: warningData,
          theme: 'striped',
          styles: {
            fontSize: 7,
            cellPadding: 2,
            lineColor: [200, 200, 200],
          },
          headStyles: {
            fillColor: [255, 251, 235],
            textColor: [146, 64, 14],
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 35, fontStyle: 'bold' },
            1: { cellWidth: 90 },
            2: { cellWidth: 55 },
          },
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
    
    // Fallback: simple PDF without custom formatting
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('ViDA UBL Validation Report', 20, 30);
    doc.setFontSize(12);
    doc.text(`Status: ${result.valid ? 'PASSED' : 'FAILED'}`, 20, 50);
    doc.text(`Errors: ${result.errors?.length || 0}`, 20, 65);
    doc.text(`Warnings: ${result.warnings?.length || 0}`, 20, 80);
    
    if (result.vida) {
      doc.text(`ViDA Score: ${result.vida.score || 0}/100`, 20, 100);
    }
    
    doc.text('PDF generation encountered an error. Please contact support.', 20, 120);
    doc.save(filename);
    
    throw error;
  }
}

// Alternative: Use web fonts approach for future enhancement
export async function loadCustomFont(): Promise<string | null> {
  try {
    // This could be used to load DejaVu Sans from a CDN in the future
    // const response = await fetch('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap');
    // return await response.text();
    return null;
  } catch (error) {
    console.warn('Could not load custom font:', error);
    return null;
  }
}