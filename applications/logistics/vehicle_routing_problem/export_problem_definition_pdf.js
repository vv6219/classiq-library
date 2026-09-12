const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const webSimDir = path.join(rootDir, 'web_simulator');
const katex = require(path.join(webSimDir, 'node_modules', 'katex'));

const mdPath = path.join(rootDir, 'md', '1. Dispatching Problem Definition.md');
const pdfDir = path.join(rootDir, 'PDF');
const exportDir = path.join(rootDir, 'Export');

if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

const targetPdf = path.join(pdfDir, '1. Dispatching Problem Definition.pdf');
const exportPdf = path.join(exportDir, '1. Dispatching Problem Definition.pdf');
const tempHtmlPath = path.join(rootDir, 'temp_problem_definition.html');

console.log('Reading source markdown:', mdPath);
const rawFile = fs.readFileSync(mdPath, 'utf-8');

// KaTeX CSS
const katexCssPath = path.join(webSimDir, 'node_modules', 'katex', 'dist', 'katex.min.css');
let katexCss = fs.readFileSync(katexCssPath, 'utf-8');
const katexDistFonts = path.join(webSimDir, 'node_modules', 'katex', 'dist', 'fonts').replace(/\\/g, '/');
katexCss = katexCss.replace(/url\(fonts\//g, `url(file:///${katexDistFonts}/`);

function renderLatex(tex, isDisplay = false) {
  try {
    return katex.renderToString(tex, {
      displayMode: isDisplay,
      throwOnError: false
    });
  } catch (err) {
    return `<code>${tex}</code>`;
  }
}

// Extract only the text before [image1]: base64 definitions
const lines = rawFile.split('\n');
const imgDefIdx = lines.findIndex(l => l.startsWith('[image1]:'));
const textLines = (imgDefIdx !== -1 ? lines.slice(0, imgDefIdx) : lines);
console.log(`Processing ${textLines.length} markdown content lines...`);

// Step 1: Replace MathJax viewer links with KaTeX
// Regex handles escaped parentheses inside the link target URL: (?:\\.|[^)])*
let rawText = textLines.join('\n');

rawText = rawText.replace(/\[!\[\]\[image\d+\]\]\((https:\/\/saxarona\.github\.io\/mathjax-viewer\/\?input=(?:\\.|[^)])*)\)/g, (match, url) => {
  const inputIdx = url.indexOf('?input=');
  if (inputIdx === -1) return match;
  let inputStr = url.substring(inputIdx + 7);
  let hashMode = null;
  const hashIdx = inputStr.lastIndexOf('#');
  if (hashIdx !== -1) {
    hashMode = inputStr.substring(hashIdx + 1);
    inputStr = inputStr.substring(0, hashIdx);
  }
  inputStr = inputStr.replace(/\\([()])/g, '$1');
  let tex = '';
  try {
    tex = decodeURIComponent(inputStr);
  } catch (e) {
    tex = unescape(inputStr);
  }
  tex = tex.replace(/\\([()])/g, '$1');
  const isDisplay = (hashMode === '0');
  return renderLatex(tex.trim(), isDisplay);
});

// Step 2: Replace standard $...$ math
rawText = rawText.replace(/\$([^$\n]+?)\$/g, (match, tex) => {
  let cleanTex = tex.trim().replace(/\\\\/g, '\\');
  cleanTex = cleanTex.replace(/\\\[/g, '[').replace(/\\\]/g, ']').replace(/\\_/g, '_');
  return renderLatex(cleanTex, false);
});

// Step 3: Parse markdown to semantic HTML
const contentLines = rawText.split('\n');
let htmlBody = '';
let inList = false;
let inOrderedList = false;
let inDiagram = false;
let diagramBuffer = [];
let inTable = false;
let tableRows = [];

function flushDiagram() {
  if (diagramBuffer.length > 0) {
    htmlBody += `<pre class="diagram">${diagramBuffer.join('\n')}</pre>\n`;
    diagramBuffer = [];
  }
  inDiagram = false;
}

function flushTable() {
  if (tableRows.length > 0) {
    let tableHtml = '<table class="spec-table">\n';
    let isHeader = true;
    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i];
      if (row.every(cell => /^:?-+:?$/.test(cell.trim()))) {
        isHeader = false;
        continue;
      }
      if (isHeader) {
        tableHtml += '  <thead><tr>' + row.map(c => `<th>${c.trim() || '&nbsp;'}</th>`).join('') + '</tr></thead>\n  <tbody>\n';
        isHeader = false;
      } else {
        tableHtml += '  <tr>' + row.map(c => `<td>${c.trim() || '&nbsp;'}</td>`).join('') + '</tr>\n';
      }
    }
    tableHtml += '  </tbody>\n</table>\n';
    htmlBody += tableHtml;
    tableRows = [];
  }
  inTable = false;
}

function closeLists() {
  if (inList) { htmlBody += '</ul>\n'; inList = false; }
  if (inOrderedList) { htmlBody += '</ol>\n'; inOrderedList = false; }
}

for (let i = 0; i < contentLines.length; i++) {
  const line = contentLines[i];
  const trimmed = line.trim();

  // Check for diagram box drawing characters
  const isBoxChar = /[┌┐└┘├┤│─┼▼▲◀▶├──└──]/.test(line);
  if (isBoxChar) {
    closeLists();
    if (inTable) flushTable();
    inDiagram = true;
    diagramBuffer.push(line);
    continue;
  } else if (inDiagram) {
    flushDiagram();
  }

  // Check for Table Row
  if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
    closeLists();
    inTable = true;
    const cells = trimmed.slice(1, -1).split('|');
    tableRows.push(cells);
    continue;
  } else if (inTable) {
    flushTable();
  }

  // Blank lines or &nbsp;
  if (trimmed === '' || trimmed === '&nbsp;') {
    closeLists();
    continue;
  }

  // Empty headers like "###" with no text
  if (/^#{1,5}\s*$/.test(trimmed)) {
    continue;
  }

  // Headers with hash
  const hMatch = trimmed.match(/^(#{1,5})\s+(.*)$/);
  if (hMatch) {
    closeLists();
    const level = hMatch[1].length;
    let title = hMatch[2].replace(/\*\*/g, '').replace(/\\/g, '').trim();
    if (title.length > 0) {
      htmlBody += `<h${level}>${title}</h${level}>\n`;
    }
    continue;
  }

  // Numbered subheaders without hashes like "2.1. Spatial Topology..."
  const subHMatch = trimmed.match(/^(\d+\.\d+\.?)\s+(.*)$/);
  if (subHMatch && !trimmed.startsWith('1.') && !trimmed.startsWith('2.') && !trimmed.startsWith('3.') && !trimmed.startsWith('4.') && !trimmed.startsWith('5.')) {
    closeLists();
    let title = trimmed.replace(/\*\*/g, '').replace(/\\/g, '').trim();
    htmlBody += `<h3>${title}</h3>\n`;
    continue;
  }

  // Restriction headers like "Restriction 10: 3D Geometric Bin Packing..."
  if (/^Restriction\s+\d+:/i.test(trimmed)) {
    closeLists();
    htmlBody += `<div class="restriction-title">${trimmed}</div>\n`;
    continue;
  }

  // Unordered list item
  const ulMatch = line.match(/^(\s*)([\*\-])\s+(.*)$/);
  if (ulMatch) {
    if (inOrderedList) { htmlBody += '</ol>\n'; inOrderedList = false; }
    if (!inList) { htmlBody += '<ul>\n'; inList = true; }
    let itemContent = ulMatch[3];
    itemContent = itemContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    itemContent = itemContent.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    htmlBody += `  <li>${itemContent}</li>\n`;
    continue;
  }

  // Ordered list item
  const olMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
  if (olMatch) {
    if (inList) { htmlBody += '</ul>\n'; inList = false; }
    if (!inOrderedList) { htmlBody += '<ol>\n'; inOrderedList = true; }
    let itemContent = olMatch[3];
    itemContent = itemContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    itemContent = itemContent.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    htmlBody += `  <li>${itemContent}</li>\n`;
    continue;
  }

  // Regular paragraph
  closeLists();
  let pContent = line;
  pContent = pContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  pContent = pContent.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  htmlBody += `<p>${pContent}</p>\n`;
}

closeLists();
if (inDiagram) flushDiagram();
if (inTable) flushTable();

console.log('Parsed semantic HTML length:', htmlBody.length);

const finalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dispatching Problem Definition - Formal Mathematical Architecture</title>
  <style>
    ${katexCss}

    @page {
      size: A4 portrait;
      margin: 15mm 14mm 15mm 14mm;
      @top-left {
        content: "WMS Quantum Cyber-Physical Architecture | Dispatching Problem Definition";
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 7.2pt;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      @top-right {
        content: "ER-MD-VRPTW-3D-HRI (Rev 4.2.0)";
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 7.2pt;
        color: #0284c7;
        font-weight: 600;
      }
      @bottom-left {
        content: "YesAndNo Quantum Research Team — ISO 3691-4:2023 & Classiq QMOD Certified";
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 7pt;
        color: #94a3b8;
      }
      @bottom-right {
        content: "Page " counter(page);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        font-size: 7.5pt;
        color: #475569;
        font-weight: 700;
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      line-height: 1.45;
      font-size: 8.5pt;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }

    /* Badges */
    .badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .badge-green { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
    .badge-cyan { background: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }
    .badge-purple { background: #f3e8ff; color: #7e22ce; border: 1px solid #d8b4fe; }
    .badge-amber { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

    /* Headers */
    h1 {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
      border-bottom: 2.5px solid #0284c7;
      padding-bottom: 6px;
    }

    h2 {
      font-size: 11.5pt;
      font-weight: 700;
      color: #0369a1;
      margin: 16px 0 6px 0;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      page-break-after: avoid;
      break-after: avoid;
    }

    h3 {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      margin: 11px 0 4px 0;
      page-break-after: avoid;
      break-after: avoid;
    }

    h4 {
      font-size: 8.8pt;
      font-weight: 700;
      color: #334155;
      margin: 9px 0 3px 0;
      page-break-after: avoid;
      break-after: avoid;
    }

    .restriction-title {
      font-size: 10pt;
      font-weight: 800;
      color: #0284c7;
      margin: 14px 0 4px 0;
      padding: 4px 8px;
      background: #f0f9ff;
      border-left: 3.5px solid #0284c7;
      border-radius: 3px;
      page-break-after: avoid;
      break-after: avoid;
    }

    p {
      margin: 0 0 6px 0;
      text-align: justify;
    }

    ul, ol {
      margin: 0 0 8px 0;
      padding-left: 18px;
    }

    li {
      margin-bottom: 3px;
    }

    /* KaTeX print styles */
    .katex {
      font-size: 1.02em !important;
    }

    .katex-display {
      margin: 6px 0 !important;
      padding: 5px 10px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 3.5px solid #0284c7;
      border-radius: 5px;
      overflow-x: auto;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Diagrams */
    pre.diagram {
      background: #090d16;
      color: #38bdf8;
      font-family: 'Consolas', 'Courier New', monospace;
      font-size: 6.8pt;
      line-height: 1.25;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid #1e293b;
      overflow-x: hidden;
      margin: 8px 0;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    code {
      font-family: 'Consolas', Courier, monospace;
      font-size: 7.8pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 1px 3px;
      border-radius: 3px;
    }

    /* Tables */
    table.spec-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 7.2pt;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    table.spec-table th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      padding: 5px 6px;
      text-align: left;
      font-size: 7pt;
      letter-spacing: 0.02em;
    }

    table.spec-table td {
      padding: 4px 6px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      line-height: 1.35;
    }

    table.spec-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Overview Metadata Grid */
    .spec-meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      margin-bottom: 14px;
      background: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
    }

    .meta-item { display: flex; flex-direction: column; }
    .meta-lbl {
      font-size: 6.8pt;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .meta-txt {
      font-size: 8.2pt;
      color: #0f172a;
      font-weight: 600;
    }
  </style>
</head>
<body>

  <div class="badge-row">
    <span class="badge badge-green">Code Verified</span>
    <span class="badge badge-cyan">ISO 3691-4:2023 Compliant</span>
    <span class="badge badge-purple">Classiq QMOD 0.46+</span>
    <span class="badge badge-amber">Revision 4.2.0</span>
  </div>

  <div class="spec-meta-grid">
    <div class="meta-item">
      <span class="meta-lbl">Formal Model Classification</span>
      <span class="meta-txt">Extended Rich Multi-Depot Pickup-and-Delivery (ER-MD-VRPTW-3D-HRI)</span>
    </div>
    <div class="meta-item">
      <span class="meta-lbl">Verification Authority &amp; Author</span>
      <span class="meta-txt">Senior Principal System Architect &amp; YesAndNo Quantum Team</span>
    </div>
    <div class="meta-item">
      <span class="meta-lbl">Mathematical Decomposition</span>
      <span class="meta-txt">4-Tier Closed Loop with Generalized Benders Recourse Feedback</span>
    </div>
    <div class="meta-item">
      <span class="meta-lbl">Safety &amp; Compliance Standards</span>
      <span class="meta-txt">ISO 3691-4:2023 (AMR Kinematics), VDI 2510, OpenAPI 3.1.0</span>
    </div>
  </div>

  ${htmlBody}

  <br>
  <hr style="border: none; border-top: 1px solid #cbd5e1; margin-top: 15px;" />
  <div style="display: flex; justify-content: space-between; font-size: 7.2pt; color: #64748b; margin-top: 6px;">
    <span>Certified by YesAndNo Quantum Research Team</span>
    <span>Document Ref: QWMS-PROB-DEF-2026-V4.2</span>
    <span>Compliance: ISO 3691-4:2023 &amp; Classiq QMOD 0.46+</span>
  </div>

</body>
</html>`;

fs.writeFileSync(tempHtmlPath, finalHtml, 'utf-8');
console.log('Wrote publication HTML to:', tempHtmlPath);

// Execute Microsoft Edge Headless print-to-pdf
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const fileUri = 'file:///' + tempHtmlPath.replace(/\\/g, '/');
const cmd = `"${edgePath}" --headless=new --disable-gpu --run-all-compositor-stages-before-draw --no-pdf-header-footer "--print-to-pdf=${targetPdf}" "${fileUri}"`;

console.log('Compiling PDF via Microsoft Edge Headless engine...');
try {
  execSync(cmd, { stdio: 'inherit' });
  console.log('Successfully generated PDF at:', targetPdf);
  fs.copyFileSync(targetPdf, exportPdf);
  console.log('Copied PDF to export directory:', exportPdf);
  if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
  const stats = fs.statSync(targetPdf);
  console.log('PDF File Size:', (stats.size / 1024).toFixed(1), 'KB');
} catch (err) {
  console.error('Error generating PDF:', err.message);
  process.exit(1);
}
