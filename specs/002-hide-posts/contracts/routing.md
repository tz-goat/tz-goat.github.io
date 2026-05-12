# Contract: Public Routing & Visibility

## Public routes in scope

- `/` (home, recent posts)
- `/blog` (all posts list)
- `/blog/[slug]` (post detail)
- `/tags/[tag]` (tag aggregation)

## Visibility rules

- Hidden posts MUST NOT appear in:
  - `/` recent posts list
  - `/blog` list
  - `/tags/[tag]` lists
  - any derived tag list used to generate static tag pages
- Hidden posts MUST NOT be accessible at `/blog/[slug]` and SHOULD behave as not found/unavailable (no content rendered).

## Static params contract

- Static params generation for `/blog/[slug]` MUST exclude hidden posts.
