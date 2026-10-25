@AGENTS.md

# Design improvements

For UI/UX work on this site, use the Stitch design skills installed at `~/.claude/skills/`:

- **stitch-design** — primary entry point for new screen design and edits via the Stitch MCP. Use for "design a page", "redesign hero", "make this more modern", or any high-fidelity layout work.
- **design-md** — synthesize/maintain a `.stitch/DESIGN.md` source-of-truth document so screens stay visually consistent.
- **taste-design** — apply opinionated visual taste (typography, spacing, color, hierarchy) to existing components.
- **shadcn-ui** — when adding shadcn/ui primitives.
- **react-components** — when authoring new React component patterns.
- **enhance-prompt** — turn rough design intent into structured Stitch prompts.

Trigger when the user asks to redesign, polish, modernize, or rework UI on any page in `src/app/` or component in `src/components/`. Output should respect the Tailwind v4 + Next.js 16 conventions already in this repo (no CSS-in-JS, server components by default, no `use client` unless interactivity requires it).
