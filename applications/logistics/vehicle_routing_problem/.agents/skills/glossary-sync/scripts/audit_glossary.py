"""
Glossary Audit & Synchronization Tool
Verifies glossary integrity in web_simulator/src/data/glossaryRegistry.ts
and discovers potential missing terms/acronyms across DispatchEngine and web_simulator.
"""

import os
import re
import sys

def run_audit():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_root = os.path.abspath(os.path.join(script_dir, "..", "..", "..", ".."))
    registry_path = os.path.join(workspace_root, "web_simulator", "src", "data", "glossaryRegistry.ts")

    if not os.path.exists(registry_path):
        print(f"[ERROR] Glossary registry not found at {registry_path}")
        sys.exit(1)

    with open(registry_path, "r", encoding="utf-8") as f:
        registry_content = f.read()

    # Extract registered IDs
    registered_ids = set(re.findall(r"id:\s*'([a-zA-Z0-9_-]+)'", registry_content))
    registered_terms = set(re.findall(r"term:\s*'([^']+)'", registry_content))
    
    print(f"=== GLOSSARY INTEGRITY AUDIT ===")
    print(f"Total Registered Terms: {len(registered_ids)}")

    # Check for dangling relatedTermIds
    related_blocks = re.findall(r"relatedTermIds:\s*\[(.*?)\]", registry_content, re.DOTALL)
    dangling_count = 0
    for block in related_blocks:
        refs = re.findall(r"'([a-zA-Z0-9_-]+)'", block)
        for ref in refs:
            if ref not in registered_ids:
                print(f"[WARNING] Dangling relatedTermId reference found: '{ref}'")
                dangling_count += 1

    if dangling_count == 0:
        print("[PASS] No dangling relatedTermIds found. All cross-links resolve properly.")

    # Check for schemaType references
    schema_refs = set(re.findall(r"schemaType:\s*'([a-zA-Z0-9_-]+)'", registry_content))
    print(f"Schemas Linked: {len(schema_refs)} ({', '.join(sorted(schema_refs))})")

    # Scan for common logistics/quantum acronyms in DispatchEngine
    engine_dir = os.path.join(workspace_root, "DispatchEngine")
    found_acronyms = set()
    if os.path.exists(engine_dir):
        for root, _, files in os.walk(engine_dir):
            for file in files:
                if file.endswith((".py", ".md")):
                    fp = os.path.join(root, file)
                    with open(fp, "r", encoding="utf-8", errors="ignore") as f:
                        text = f.read()
                        # Extract 3-6 uppercase letters
                        caps = re.findall(r"\b[A-Z]{3,7}\b", text)
                        for c in caps:
                            if c not in {"TRUE", "FALSE", "NONE", "SELF", "HTTP", "JSON", "UTF", "TODO", "NOTE"}:
                                found_acronyms.add(c)

    # Check coverage of acronyms
    covered = []
    uncovered = []
    for acr in sorted(found_acronyms):
        # Check if acr is inside any registered term or acronymExpansion or ID
        if any(acr.lower() == rid.lower() or acr in term for rid, term in zip(registered_ids, registered_terms)):
            covered.append(acr)
        else:
            uncovered.append(acr)

    print(f"\nDiscovered Acronyms in DispatchEngine: {len(found_acronyms)}")
    print(f"Covered in Glossary: {len(covered)}")
    if uncovered:
        print(f"Candidate Acronyms to evaluate for inclusion (first 15): {', '.join(uncovered[:15])}")

    print("\n[SUCCESS] Glossary audit complete.")

if __name__ == "__main__":
    run_audit()
