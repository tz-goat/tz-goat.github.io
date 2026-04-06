<!--
Sync Impact Report
- Version: (template) → 1.0.0 — initial ratification; filled all placeholders for this repo.
- Principles: all new (replaced template placeholders I–V with Next.js blog principles).
- Sections: Technology & Content Constraints; Development Workflow (new concrete content).
- Templates: .specify/templates/plan-template.md ✅ | spec-template.md ✅ | tasks-template.md ✅
- Deferred: none.
-->

# my-blog Constitution

## Core Principles

### I. Next.js as the delivery surface

The site MUST be implemented with Next.js using idiomatic App Router patterns unless a
governance-approved amendment documents a migration. Routing, data loading, and rendering
choices MUST favor maintainability and framework conventions over custom stacks.

### II. Blog posts live under `posts/` (NON-NEGOTIABLE)

All blog article source files MUST be Markdown (`.md`) in the repository-root `posts/`
directory. New posts, imports, and tooling MUST NOT relocate primary post content to other
folders without a constitution amendment. Supporting assets MAY live under `public/` or
paths explicitly documented in the implementation plan for a feature.

### III. Performance and reader experience

Pages MUST be built and delivered so that typical posts remain fast to load: prefer static
or cached generation where appropriate, optimize images through Next.js mechanisms, and
avoid unnecessary client-side weight. Regressions in Core Web Vitals for primary templates
MUST be treated as defects unless explicitly accepted in spec success criteria.

### IV. Quality gates

TypeScript and project lint rules MUST pass on changed code. Automated tests SHOULD cover
non-trivial content parsing, routing, or data transforms; pure presentation may rely on
lint/typecheck when proportionate. Breaking changes to URL schemes or post frontmatter
contracts MUST be documented in the feature spec and migration notes.

### V. Simplicity

Prefer the smallest change that meets the spec. Avoid new dependencies, abstractions, or
services unless justified in the plan’s Constitution Check. YAGNI applies to CMS-like
features until specified.

## Technology & Content Constraints

- **Runtime**: Next.js (current major version tracked by the repo); Node.js per `package.json`
  engines if present.
- **Content**: Markdown in `posts/` with stable frontmatter fields agreed per feature (e.g.
  title, date). MDX or other formats require an explicit spec and amendment if they replace
  `.md` as the canonical post format.
- **Assets**: Static files under `public/` unless the plan states otherwise.

## Development Workflow

- Features touching content location, URL structure, or build pipeline MUST pass the
  Constitution Check in `plan.md` before implementation proceeds.
- Pull requests SHOULD link to or summarize spec/plan context when using Spec Kit branches
  under `specs/`.
- Complexity or exceptions to principles MUST be recorded under “Complexity Tracking” in the
  plan when gates cannot be fully met.

## Governance

This constitution supersedes informal conventions for this repository. Amendments require an
update to `.specify/memory/constitution.md`, a version bump per semantic rules below, and
refreshing dependent templates when gates or path rules change. Reviewers SHOULD verify
compliance for content paths and Next.js usage on relevant PRs.

**Versioning**: MAJOR — removed or redefined principles; MINOR — new principle or material
new constraint; PATCH — wording or clarification only.

**Version**: 1.0.0 | **Ratified**: 2026-04-06 | **Last Amended**: 2026-04-06
