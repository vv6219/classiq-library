import katex from 'katex';
import fs from 'fs';

const jsonPath = 'c:/Users/vladimir.dobrouchkin/source/repos/classiq-library/applications/logistics/vehicle_routing_problem/web_simulator/src/data/conceptProblemDefinition.json';
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

let total = 0;
let errors = 0;
const errorDetails = [];

function sanitizeLatex(eq) {
  let s = eq.trim();
  // Fix escaped parenthesis from Google Docs MathJax export
  s = s.replace(/\\\(/g, '(').replace(/\\\)/g, ')');
  // Fix raw double backslashes or trailing hashes
  s = s.replace(/#\d+$/, '');
  // Fix \text with unmatched braces or \vert{}
  s = s.replace(/\\vert\{\}/g, '|');
  // Fix trailing or leading unescaped percent signs
  // Fix empty groups
  return s;
}

function testText(txt) {
  if (!txt) return;

  // 1. Display formulas
  const displayRegex = /\$\$\s*([\s\S]*?)\s*\$\$/g;
  let match;
  while ((match = displayRegex.exec(txt)) !== null) {
    total++;
    const raw = match[1];
    const cleaned = sanitizeLatex(raw);
    try {
      katex.renderToString(cleaned, { displayMode: true, throwOnError: true });
    } catch (e) {
      errors++;
      if (errorDetails.length < 15) {
        errorDetails.push({ raw: raw.slice(0, 70), msg: e.message });
      }
    }
  }

  // 2. Inline formulas (ignoring display)
  const noDisplay = txt.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, '');
  const inlineRegex = /\$([^\$\n]+?)\$/g;
  while ((match = inlineRegex.exec(noDisplay)) !== null) {
    total++;
    const raw = match[1];
    const cleaned = sanitizeLatex(raw);
    try {
      katex.renderToString(cleaned, { displayMode: false, throwOnError: true });
    } catch (e) {
      errors++;
      if (errorDetails.length < 15) {
        errorDetails.push({ raw: raw.slice(0, 70), msg: e.message });
      }
    }
  }
}

data.chapters.forEach(ch => {
  testText(ch.raw_content);
  ch.sections.forEach(sec => testText(sec.raw_content));
});

console.log(`Total formulas scanned: ${total}, KaTeX Errors: ${errors}`);
if (errorDetails.length > 0) {
  console.log('Sample Error Details:');
  errorDetails.forEach((ed, i) => console.log(`${i+1}. [${ed.raw}] -> ${ed.msg}`));
}
