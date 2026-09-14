---
name: glossary-sync
description: >-
  Trigger this skill whenever any new content, feature, algorithm, module, math formulation,
  safety standard, acronym, API endpoint, or documentation is created, modified, or refactored.
  It inspects the changes to ensure the Global A–Z Engineering Glossary in web_simulator
  (glossaryRegistry.ts, GlossarySchemaViewer.tsx, cross-links, and routes) is synchronized and enriched.
---

# Glossary Synchronization & Possibility Adjustment Skill

This skill enforces continuous glossary alignment across the entire Quantum WMS Digital Twin & DispatchEngine codebase. Every new component, optimization algorithm, physics formula, or safety standard introduced must be evaluated for inclusion or adjustment in the **Global A–Z Engineering Glossary**.

---

## When to Use This Skill

Activate this skill whenever:
- A new file, class, method, or module is created or substantially modified in `DispatchEngine/` or `web_simulator/`.
- A new acronym or abbreviation (e.g., AMR, AGV, KERS, MTZ, SIPP, DFJ, QUBO) is introduced or used in code/comments/UI.
- A new mathematical calculation or physical equation is implemented (e.g., shear stress, battery thermal dissipation, quantum cost Hamiltonian).
- An industrial safety standard or compliance guideline (e.g., DIN EN ISO 3691-4, VDI 2700, IEC 62619, ISO 14064) is referenced.
- A new application tab, feature studio, or sub-view is added to `web_simulator`.
- The user prompts to "check glossary", "update glossary", or adds new functional content to the repository.

---

## Step-by-Step Procedure

### Phase 1: Content Impact Assessment
Scan the modified files or newly introduced features for:
1. **New Terminology & Acronyms**: Look for domain-specific nouns, abbreviations, or operational concepts.
2. **Algorithms & Heuristics**: Identify whether any routing algorithm (e.g., Clarke-Wright, 2-Opt, Tabu Search, Genetic Algorithm, Benders cuts, QAOA) was added or modified.
3. **Mathematical Formulations**: Note equations that can be rendered in KaTeX (cost functions, kinematics, energy recovery, conflict intervals).
4. **Safety & Industry Standards**: Check if specific ISO, DIN, VDI, or IEC standards apply.
5. **Codebase Symbols & Module Paths**: Identify the exact class or module path (e.g., `DispatchEngine/core/benders_coordinator.py`).

### Phase 2: Registry Audit & Adjustment (`glossaryRegistry.ts`)
Inspect [`web_simulator/src/data/glossaryRegistry.ts`](file:///c:/Users/vladimir.dobrouchkin/source/repos/classiq-library/applications/logistics/vehicle_routing_problem/web_simulator/src/data/glossaryRegistry.ts):
1. **Check Existing Entries**:
   - Is the term already present in `GLOSSARY_ENTRIES`?
   - If yes: Does the definition, formula, standard, or `codebaseRef` need refinement to reflect the new functionality?
2. **Add New Entry (if missing)**:
   - Ensure the entry conforms strictly to `GlossaryEntry`:
     ```typescript
     {
       id: 'unique_snake_case_id',
       term: 'Canonical Display Name',
       category: 'algorithm' | 'acronym' | 'calculation' | 'standard' | 'architecture' | 'problem',
       acronymExpansion?: 'Full Name If Acronym',
       summary: 'Concise 1-2 sentence high-level definition.',
       detailedExplanation: 'In-depth engineering explanation detailing the mathematical/physical/algorithmic mechanics.',
       calculationFormula?: 'LaTeX string without outer delimiters',
       calculationExplanation?: 'Explanation of terms in the formula.',
       standardsRef?: 'DIN EN ISO 3691-4 Clause X.Y / VDI ...',
       codebaseRef?: 'DispatchEngine/path/to/file.py or web_simulator/src/...',
       relatedTermIds: ['other_term_id_1', 'other_term_id_2'],
       appDeepLink?: {
         tab: 'fleet' | 'chutes' | 'investigation' | 'docs' | 'analytics',
         label: 'Deep Link Label'
       },
       schemaId?: 'schema_identifier_if_visual_available'
     }
     ```
3. **Bi-directional Cross-linking**:
   - When adding or updating an entry, check `relatedTermIds` of existing related terms and add the reciprocal cross-link.

### Phase 3: Visual Schema Evaluation (`GlossarySchemaViewer.tsx`)
If the new concept involves a multi-stage flow, architectural loop, or physical diagram:
1. Check if a high-DPI vector SVG diagram should be added to [`GlossarySchemaViewer.tsx`](file:///c:/Users/vladimir.dobrouchkin/source/repos/classiq-library/applications/logistics/vehicle_routing_problem/web_simulator/src/components/GlossarySchemaViewer.tsx).
2. Register the new `schemaId` in `GlossarySchemaViewer`'s render mapping.
3. Link the `schemaId` to the glossary entry.

### Phase 4: Quick Automated Audit
Run the automated glossary audit tool:
```bash
python .agents/skills/glossary-sync/scripts/audit_glossary.py
```
This script scans codebase files and highlights potential terms and acronyms that are missing from `glossaryRegistry.ts`.

### Phase 5: Verification & Quality Gate
1. Validate TypeScript types and Vite production bundle:
   ```bash
   cd web_simulator
   npm run build
   ```
2. Verify:
   - Zero TypeScript compilation errors.
   - All `relatedTermIds` reference valid IDs in `GLOSSARY_ENTRIES`.
   - KaTeX formulas compile cleanly without unbalanced LaTeX syntax.
