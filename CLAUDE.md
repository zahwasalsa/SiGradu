# Integrated Graduation System

## Project Purpose

This application integrates:

1. Yudisium
2. Campus Hiring & Tracer Study
3. Wisuda

The system has two main user areas:

- Student Portal
- Admin/Staff Portal

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Zod
- React Hook Form

## Important Rules

1. Do not change the database schema without creating a migration.
2. Do not create new tables without explaining why.
3. Do not change business workflow without approval.
4. Do not bypass RLS.
5. Never expose Supabase secret/service-role keys to the client.
6. All protected routes must check authentication and authorization.
7. Module 2 is locked until Yudisium is approved.
8. Module 3 is locked until Tracer & Hiring is approved.
9. Student data from Module 1 must be reused in Modules 2 and 3.
10. Every important status change must create a status history record.
11. Hiring threshold must be configurable by admin.
12. Admin bypass must always record admin, timestamp, and reason.
13. Do not hardcode business rules that are defined as configurable parameters.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
