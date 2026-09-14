# Workspace Agent Directives: Quantum WMS Digital Twin & DispatchEngine

## Continuous Glossary Alignment Rule

Whenever you create, refactor, or introduce new content in this workspace (`DispatchEngine/` or `web_simulator/`), you **MUST** evaluate whether the **Global A–Z Engineering Glossary** (`web_simulator/src/data/glossaryRegistry.ts`) requires adjustment or enrichment.

### Mandatory Workflow:
1. **Activate the `glossary-sync` skill**:
   - Consult [.agents/skills/glossary-sync/SKILL.md](./.agents/skills/glossary-sync/SKILL.md) for step-by-step procedures.
2. **Scan for New Artifacts**:
   - **Algorithms & Heuristics**: e.g., Benders decomposition, QAOA, SIPP, DFJ, 2-Opt, Tabu, ALNS, simulated annealing.
   - **Acronyms**: e.g., AMR, AGV, KERS, MTZ, SIPP, QUBO, QPU, SoC, CoM, LIFO, FIFO, WMS, SLA.
   - **Mathematical Calculations**: e.g., KaTeX formulas for kinematics, shear stresses, state-of-charge decay, objective functions.
   - **Safety & Industrial Standards**: e.g., DIN EN ISO 3691-4, VDI 2700, IEC 62619, ISO 14064.
   - **Code Architecture Modules**: e.g., new engine coordinators, handlers, or simulator studios.
3. **Registry Adjustment**:
   - If an entry is missing, add it to `web_simulator/src/data/glossaryRegistry.ts` adhering to the `GlossaryEntry` interface.
   - If an existing entry is affected, update its explanation, formula, codebase reference, or related terms.
   - Ensure bidirectional cross-linking in `relatedTermIds`.
4. **Visual Schema Check**:
   - If the new concept features complex workflows or physical diagrams, add or update a high-DPI vector SVG in `web_simulator/src/components/GlossarySchemaViewer.tsx`.
5. **Verification**:
   - Run `npm run build` inside `web_simulator` to guarantee zero TypeScript or build errors.
