import urllib.parse
import re
import json
import os

source_file = r'c:\Users\vladimir.dobrouchkin\source\repos\classiq-library\applications\logistics\vehicle_routing_problem\md\1. Dispatching Problem Definition.md'
target_json = r'c:\Users\vladimir.dobrouchkin\source\repos\classiq-library\applications\logistics\vehicle_routing_problem\web_simulator\src\data\conceptProblemDefinition.json'

os.makedirs(os.path.dirname(target_json), exist_ok=True)

with open(source_file, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Strip the data:image base64 dictionary at the bottom
text_clean = re.split(r'\[image\d+\]:\s*<data:image', text)[0]

# 2. Replace all MathJax URLs with clean standard LaTeX ($...$ or $$...$$)
url_pattern = re.compile(r'\[\!\[\]\[image\d+\]\]\(https://saxarona\.github\.io/mathjax-viewer/\?input=(.*?)#(0|1|2)\)')

def fix_text_underscores(latex: str) -> str:
    # Inside \text{...}, replace _ with \_ so KaTeX parses it correctly in text mode
    def repl(m):
        return r'\text{' + m.group(1).replace('_', r'\_') + '}'
    return re.sub(r'\\text\{([^{}]*)\}', repl, latex)

def sanitize_formula(latex: str) -> str:
    # 1. Google docs MathJax unescaped parenthesis
    latex = latex.replace(r'\(', '(').replace(r'\)', ')')
    # 2. Bracket fixes
    latex = latex.replace(r'\[', '[').replace(r'\]', ']')
    # 3. KaTeX dislikes \vert{} with empty braces
    latex = latex.replace(r'\vert{}', r'|')
    latex = latex.replace(r'\vert', r'|')
    # 4. Strip markdown backslash-escaped underscores for math subscripts
    latex = latex.replace(r'\_', '_')
    # 5. But re-escape underscores inside \text{...}
    latex = fix_text_underscores(latex)
    # 6. Strip trailing spaces and hashes
    latex = re.sub(r'#\d+$', '', latex).strip()
    return latex

def replace_mathjax(match):
    encoded = match.group(1)
    flag = match.group(2)
    latex = urllib.parse.unquote(encoded).strip()
    latex = sanitize_formula(latex)
    if flag in ('0', '1'):
        return f'\n\n$$\n{latex}\n$$\n\n'
    else:
        return f' ${latex}$ '

processed_md = url_pattern.sub(replace_mathjax, text_clean)
processed_md = processed_md.replace('&nbsp;', '')

# Also fix markdown-escaped math in the prose (e.g. $\\[\\underline{F}\\_d, \\bar{F}\\_d\\]$)
def fix_prose_math(match):
    inner = match.group(1)
    cleaned = sanitize_formula(inner)
    return f'${cleaned}$'

processed_md = re.sub(r'\$([^\$\n]+?)\$', fix_prose_math, processed_md)

# 3. Categorize into Major Chapters based on headings
chapters = []
current_chapter = None
current_section = None

header_regex = re.compile(r'^\s*(#{2,4})\s*(.+)$')

lines = processed_md.split('\n')
for line in lines:
    m = header_regex.match(line)
    if m:
        level = len(m.group(1))
        title = m.group(2).replace('*', '').replace('\\', '').strip()
        # Ignore empty dummy headers like '###'
        if not title:
            continue

        if level == 2:
            current_chapter = {
                'id': f'ch-{len(chapters)+1}',
                'title': title,
                'sections': [],
                'content': []
            }
            chapters.append(current_chapter)
            current_section = None
        elif level == 3:
            if not current_chapter:
                current_chapter = {
                    'id': f'ch-{len(chapters)+1}',
                    'title': 'Introduction & Context',
                    'sections': [],
                    'content': []
                }
                chapters.append(current_chapter)
            current_section = {
                'id': f'sec-{len(chapters)}-{len(current_chapter["sections"])+1}',
                'title': title,
                'content': []
            }
            current_chapter['sections'].append(current_section)
        elif level == 4:
            if current_section:
                current_section['content'].append(f'#### {title}')
            elif current_chapter:
                current_chapter['content'].append(f'#### {title}')
    else:
        if current_section:
            current_section['content'].append(line)
        elif current_chapter:
            current_chapter['content'].append(line)

# Convert content arrays to strings
for ch in chapters:
    ch['raw_content'] = '\n'.join(ch['content']).strip()
    for sec in ch['sections']:
        sec['raw_content'] = '\n'.join(sec['content']).strip()

output_data = {
    'title': 'Dispatching Problem Definition & Mathematical Architecture',
    'subtitle': 'Extended Rich Multi-Depot, Multi-Trip, Multi-Commodity Pickup-and-Delivery Problem with Open Time Windows, 3D Containerization, Human-Robot Shared Spaces, and Stochastic Disruption Recourse',
    'problem_class': r'\mathcal{P}_{\text{ER-MD-VRPTW-3D-HRI}}',
    'total_formulas': len(url_pattern.findall(text_clean)),
    'verification_invariant': 'lmn',
    'falsification_ratio': r'\Phi < 1.0',
    'chapters': chapters
}

with open(target_json, 'w', encoding='utf-8') as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print(f'Successfully structured {len(chapters)} major chapters and {sum(len(c["sections"]) for c in chapters)} sub-sections!')
