# Contract: Post Frontmatter (Visibility)

## Scope

This contract defines the visibility-related frontmatter for Markdown posts under `posts/`.

## Field: `hidden`

- Type: boolean
- Optional: yes
- Default: `false` (public)
- Meaning:
  - `hidden: true` → post is hidden from all public lists and cannot be accessed by its public post URL (treated as not found/unavailable)
  - `hidden: false` or omitted → post is public

## Compatibility

- Existing posts without `hidden` remain public and require no changes.
- This field is additive and does not change the slug, URL, or required frontmatter fields.
