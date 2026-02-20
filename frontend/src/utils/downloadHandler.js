/**
 * Download utility for exporting student assistant content
 * Supports: MCQs, Summaries, Flashcards in JSON, CSV, and PDF formats
 */

export function downloadAsJSON(data, filename) {
  const element = document.createElement('a');
  element.setAttribute(
    'href',
    `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`
  );
  element.setAttribute('download', `${filename}.json`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function downloadAsCSV(data, filename) {
  let csv = '';

  if (Array.isArray(data)) {
    // Handle MCQs or other arrays
    if (data.length > 0 && data[0].question) {
      csv = 'Question,Option A,Option B,Option C,Option D,Option E,Correct Answer\n';
      data.forEach((item) => {
        const q = escapeCSV(item.question);
        const a = escapeCSV(item.options?.A || '');
        const b = escapeCSV(item.options?.B || '');
        const c = escapeCSV(item.options?.C || '');
        const d = escapeCSV(item.options?.D || '');
        const e = escapeCSV(item.options?.E || '');
        const ans = escapeCSV(item.correct_answer || '');
        csv += `${q},${a},${b},${c},${d},${e},${ans}\n`;
      });
    }
  } else if (typeof data === 'string') {
    // Handle summaries or text content
    csv = data;
  } else if (data.summary) {
    // Handle summary objects
    csv = `Summary\n${data.summary}`;
  }

  const element = document.createElement('a');
  element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`);
  element.setAttribute('download', `${filename}.csv`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

function escapeCSV(str) {
  if (typeof str !== 'string') return '';
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadAsText(content, filename) {
  const element = document.createElement('a');
  element.setAttribute(
    'href',
    `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`
  );
  element.setAttribute('download', `${filename}.txt`);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export function downloadFile(content, filename, format = 'json') {
  const timestamp = new Date().toISOString().slice(0, 10);
  const fullFilename = `${filename}_${timestamp}`;

  switch (format.toLowerCase()) {
    case 'json':
      downloadAsJSON(content, fullFilename);
      break;
    case 'csv':
      downloadAsCSV(content, fullFilename);
      break;
    case 'txt':
    case 'text':
      downloadAsText(
        typeof content === 'string' ? content : JSON.stringify(content, null, 2),
        fullFilename
      );
      break;
    default:
      downloadAsJSON(content, fullFilename);
  }
}

export function formatMCQForDownload(mcqs) {
  if (!Array.isArray(mcqs)) return [];
  return mcqs.map((mcq) => ({
    question: mcq.question || '',
    options: mcq.options || {},
    correct_answer: mcq.correct_answer || '',
    explanation: mcq.explanation || '',
  }));
}

export function formatSummaryForDownload(summary) {
  if (typeof summary === 'string') return summary;
  if (summary.summary) return summary.summary;
  return JSON.stringify(summary, null, 2);
}

export function formatFlashcardsForDownload(flashcards) {
  if (!Array.isArray(flashcards)) return [];
  return flashcards.map((card) => ({
    front: card.front || card.question || '',
    back: card.back || card.answer || '',
  }));
}
