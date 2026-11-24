# Dream CV Resume Builder

Dream CV is a modern resume builder that helps users create a professional CV through a simple, guided online experience.

Users can enter their contact information, education, work experience, skills, projects, certifications, and professional summary. The application organizes that information into a clean, formal resume preview that can be viewed, edited, printed, or saved as a PDF.

## Purpose

The purpose of Dream CV is to make resume creation faster, more structured, and easier to manage.

The application helps users:

- Create a complete professional resume
- Organize career information in the correct order
- Reuse and update saved resume details
- Preview resume data before downloading
- Generate a print-ready A4 PDF
- Access the resume builder from desktop or mobile devices

## Resume sections

The resume builder collects information in this order:

1. Contact Information
2. Education and Training
3. Work Experience
4. Skills
5. Projects
6. Certifications
7. Professional Summary

The resume preview presents the information in this order:

1. Professional Summary
2. Skills
3. Experience
4. Education and Training
5. Projects
6. Certifications

## Key features

- Guided resume-building workflow
- Multiple education entries
- Multiple work-experience entries
- Custom and selected skill lists
- Multiple projects with repository links
- Professional certifications with credential links
- Saved CV management
- Formal resume preview
- Print and Save PDF support
- Account registration and login
- Forgot-password and password-reset support
- Responsive navigation sidebar
- Mobile-friendly slide-in menu

## Technology stack

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript
- Responsive browser layout
- Fetch API

### Backend

- Node.js
- Express
- Supabase PostgreSQL
- postgres.js
- JSON Web Tokens
- BCrypt
- Express Rate Limit
- Resend email API

## Security

- **Passwords:** bcrypt (cost 12), 10-72 characters. Login takes the same time whether or not the email exists.
- **Sessions:** JWT (1 day) tied to a per-user `token_version`; resetting a password revokes every existing session, and tokens of deleted users stop working immediately.
- **Password reset:** random 32-byte token stored only as a SHA-256 hash, 30-minute expiry, single use (atomic), one email per account per minute. The response is identical for registered and unregistered addresses, even if the email provider fails.
- **Rate limiting:** login (per IP *and* per account, failed attempts only), register, forgot/reset password and the resume API. Proxy-aware via `TRUST_PROXY`.
- **Input handling:** every resume field is type-checked, length-limited and whitelisted server-side; links must be `http(s)`; unknown fields are dropped.
- **Output handling:** user data is never interpolated into HTML attributes; the preview escapes all values and only renders `http(s)` links.
- **Browser hardening:** every page ships a Content-Security-Policy (`script-src 'self'`, no inline scripts) and the reset page sends no Referer and removes the token from the URL.
- **API hardening:** `helmet` headers, strict CORS, JSON-only errors without stack traces, 100 kB body limit.
- **Fail-fast config:** the server will not start with a missing/weak/placeholder `JWT_SECRET`, or (in production) a non-https `FRONTEND_URL`.

## Running locally

```bash
cd backend
cp .env.example .env        # then fill in JWT_SECRET (see the comment in the file)
npm install
npm run dev
```

Serve the `frontend/` folder with any static server (for example VS Code Live Server on port 5500). The frontend talks to `http://127.0.0.1:5000` automatically when opened from localhost.

## Deploying

1. **Backend:** set `NODE_ENV=production`, a real `JWT_SECRET`, `DATABASE_URL` (Supabase PostgreSQL connection string), `FRONTEND_URL=https://your-site`, `TRUST_PROXY=1` (one proxy in front), and a verified Resend domain for `RESEND_FROM`.
2. **Frontend:** set `PRODUCTION_API_BASE` in `frontend/js/config.js` to your HTTPS API origin (or leave it empty if `/api` is proxied from the same origin).
3. **Host headers:** serve everything over HTTPS and add `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, and `frame-ancestors 'none'` (or `X-Frame-Options: DENY`) on the frontend host. `frame-ancestors` cannot be set from a `<meta>` tag.
4. **Existing database:** run `backend/supabase/migrations/001_initial.sql` once before starting the migrated backend.

## Supabase PostgreSQL

Supabase PostgreSQL is the active database.

1. Create a Supabase project.
2. Run `backend/supabase/migrations/001_initial.sql` in the Supabase SQL Editor.
3. Add `DATABASE_URL` to `backend/.env`.
4. Keep database credentials only on the backend. Never expose them in `frontend/` or commit them.

## Tests

```bash
cd backend
npm test
```

The integration test creates a uniquely named Supabase account and removes it after the run.

## PDF output

The resume preview uses a compact A4 portrait layout with:

- A circular initials header
- A formal serif-style resume design
- Ruled section headings
- Compact education and experience entries
- Two-column project and certification areas
- Hidden navigation and interface controls during printing
