/**
 * Reality Check AI Plus — PDF Report Generator
 * Uses jsPDF to create a downloadable analysis report.
 */
import jsPDF from 'jspdf';

export function downloadPdfReport(data) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  const addLine = (text, opts = {}) => {
    const { fontSize = 11, bold = false, color = [15, 23, 42] } = opts;
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(text, pageWidth - 30);
    lines.forEach((line) => {
      if (y > 275) { doc.addPage(); y = 20; }
      doc.text(line, 15, y);
      y += fontSize * 0.5 + 2;
    });
    y += 2;
  };

  // Title
  addLine('Reality Check AI Plus — Analysis Report', { fontSize: 18, bold: true, color: [99, 102, 241] });
  addLine(`Generated: ${new Date().toLocaleString()}`, { fontSize: 9, color: [100, 116, 139] });
  y += 6;

  // Label & confidence
  const labelColor = data.label === 'Real' ? [34, 197, 94] : data.label === 'Fake' ? [239, 68, 68] : [234, 179, 8];
  addLine(`Classification: ${data.label}  (${Math.round(data.confidence * 100)}% confidence)`, { fontSize: 14, bold: true, color: labelColor });
  y += 2;

  addLine('Summary', { fontSize: 13, bold: true });
  addLine(data.reasoning_summary);
  y += 2;

  addLine('Detailed Explanation', { fontSize: 13, bold: true });
  addLine(data.detailed_explanation);
  y += 2;

  if (data.key_inconsistencies?.length) {
    addLine('Key Inconsistencies', { fontSize: 13, bold: true });
    data.key_inconsistencies.forEach((k, i) => addLine(`${i + 1}. ${k}`));
    y += 2;
  }

  addLine('Evidence Alignment', { fontSize: 13, bold: true });
  addLine(data.evidence_alignment);
  y += 2;

  if (data.retrieved_articles?.length) {
    addLine('Retrieved Evidence', { fontSize: 13, bold: true });
    data.retrieved_articles.forEach((art, i) => {
      addLine(`${i + 1}. ${art.title} — ${art.source}`);
      addLine(`   ${art.url}`, { fontSize: 9, color: [99, 102, 241] });
    });
  }

  doc.save('RealityCheck_Report.pdf');
}
