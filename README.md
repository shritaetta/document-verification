# 🎓 Secure Certificate Verification Platform

A production-grade Next.js application for issuing, managing, and publicly verifying academic certificates. The system is built around a **security-first architecture**: every certificate is cryptographically hashed at issuance, every sensitive action is audited, and every route is gated by role-based access control enforced at multiple layers.

---

## 🔐 Security Overview

Security is not an add-on in this project — it is the core design principle. The sections below summarize the protections built into the platform.

### 1. Cryptographic Integrity Verification
- Every uploaded certificate (PDF) is hashed using **SHA-256** at upload time. The hash is stored alongside the certificate metadata.
- On verification, the system **re-downloads the stored file and recomputes the hash**, comparing it against the original. Any mismatch is reported as an **Integrity Check Failed** result — this detects tampering, corruption, or substitution of the underlying document, not just database metadata.
- Duplicate-hash detection prevents the same certificate file from being issued twice (`sha256_hash` is a unique constraint).
- PDF metadata (title, verification ID, issuer) is embedded into the document itself via `pdf-lib`, adding a secondary, harder-to-strip layer of provenance.

### 2. Role-Based Access Control (RBAC)
Three roles — **student**, **faculty**, and **admin** — are enforced at three independent layers so that a failure in one layer does not expose data:
- **Middleware** (`src/middleware.ts` / `utils/supabase/middleware.ts`): redirects unauthenticated users and blocks cross-role route access before a page ever renders.
- **Server components**: every protected page re-validates the authenticated user and role server-side (never trusts the client).
- **Database (Postgres Row-Level Security)**: Supabase RLS policies restrict `SELECT`/`INSERT`/`UPDATE` on `profiles`, `certificates`, and `audit_logs` based on the caller's role, providing defense-in-depth even if application-layer checks are bypassed.

### 3. Controlled Account Provisioning
- Public self-registration only grants the **student** role by default.
- Elevated roles (**faculty**, **admin**) require a server-validated **invite code** (`FACULTY_INVITE_CODE`, `ADMIN_INVITE_CODE`), preventing privilege escalation through the signup form.

### 4. Rate Limiting & Abuse Prevention
- Login, signup, and public verification endpoints are protected by **Upstash Redis + `@upstash/ratelimit`** sliding-window limiters:
  - Authentication: 5 requests/minute per IP
  - Verification: 30 requests/minute per IP
- The system fails open safely in local development (no Redis configured) but is designed to fail closed in production once Redis credentials are set.
- All rate-limit rejections are recorded to the audit log.

### 5. Comprehensive Audit Logging
Every security-relevant event is written to an immutable `audit_logs` table, including:
- Login success/failure, logout
- Certificate uploads, approvals, rejections, revocations
- Successful and failed verification attempts (with IP address)
- Timestamp, actor ID, entity ID, and outcome are captured for every event

Admins have access to a dedicated **Audit Log** view and **Reports** dashboard with filterable timeframes and CSV export for compliance purposes.

### 6. Certificate Revocation
- Admins can revoke a previously verified certificate at any time, recording a mandatory internal revocation reason.
- Revocation is reflected **immediately** on the public verification page, ensuring stakeholders relying on a certificate's authenticity see accurate, real-time status.

### 7. Encryption at Rest (Application Layer)
- `src/utils/encryption.ts` provides **AES-256-GCM** authenticated encryption for sensitive fields, using a 256-bit key supplied via `ENCRYPTION_KEY`.
- Authenticated encryption (GCM) ensures both confidentiality and integrity — tampering with ciphertext is detected via the auth tag before decryption succeeds.

### 8. Privilege Separation Between Clients
- A restricted **anon client** (`utils/supabase/client.ts`, `server.ts`) is used for user-scoped operations, subject to RLS.
- A separate **service-role admin client** (`createAdminClient`) is used only in trusted server-side contexts (API routes, server actions) that require elevated database access — never exposed to the browser.

### 9. Secure Document Delivery
- Certificate files are stored in a **private** Supabase Storage bucket (not publicly accessible).
- Access is only granted via **short-lived signed URLs** (60-second expiry) generated server-side at view time — documents are never served through permanent public links.

### 10. Public Verification Without Data Leakage
- The public `/verify/[verification_id]` page exposes only the minimum necessary information (student name, certificate title, issuer, status) — internal fields such as storage paths, hashes, and revocation reasons are never rendered publicly.

### 11. Security Monitoring Dashboards
- A dedicated **Admin Security Center** surfaces live system health: encryption status, rate-limiting status, audit logging status, and a feed of recent failed login attempts — giving administrators visibility into the platform's security posture at a glance.

---

## 🏗️ Architecture

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript (strict mode) |
| Database & Auth | Supabase (Postgres + Row-Level Security, Supabase Auth) |
| Storage | Supabase Storage (private buckets, signed URLs) |
| Rate Limiting | Upstash Redis + `@upstash/ratelimit` |
| UI | Tailwind CSS 4, shadcn/ui, Radix UI primitives |
| PDF Processing | `pdf-lib` |
| QR Codes | `qrcode.react` |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/            # Admin-only: dashboard, users, certificates, audit, reports, security
│   ├── faculty/           # Faculty dashboard
│   ├── student/           # Student dashboard
│   ├── certificate/       # Upload & detail views
│   ├── verify/[id]/       # Public verification page
│   ├── api/                # Route handlers (upload, seed)
│   └── actions/            # Server Actions (auth, users, certificates, verify, invite)
├── components/            # UI components (shadcn/ui + custom layout)
├── utils/
│   ├── supabase/           # Client/server/middleware Supabase factories
│   ├── rate-limit.ts        # Upstash rate limiter configuration
│   ├── encryption.ts        # AES-256-GCM helpers
│   └── audit.ts             # Audit log writer
└── middleware.ts           # Route-level auth & RBAC enforcement
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A Supabase project (Postgres + Auth + Storage)
- (Recommended for production) An Upstash Redis instance for rate limiting

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file with:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # Server-only, never expose to the client

FACULTY_INVITE_CODE=
ADMIN_INVITE_CODE=

ENCRYPTION_KEY=                     # 64-char hex string (32 bytes) for AES-256-GCM

UPSTASH_REDIS_REST_URL=            # Optional locally, required in production
UPSTASH_REDIS_REST_TOKEN=

NEXT_PUBLIC_APP_URL=                # Used to build QR/verification links
```

> ⚠️ **Never commit `.env.local`.** Rotate `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY`, and invite codes if they are ever exposed.

### Database Setup

Apply the schema in `supabase/schema.sql` to your Supabase project. This provisions:
- `profiles`, `certificates`, `audit_logs` tables
- Row-Level Security policies for all tables
- The private `certificates` storage bucket and its access policies
- Indexes for hash lookups and audit queries

### Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 🔒 Security Hardening Checklist for Production

- [ ] Set a strong, unique `ENCRYPTION_KEY` and store it in a secrets manager (not plaintext env files)
- [ ] Configure Upstash Redis so rate limiting is active (the app fails open without it)
- [ ] Rotate `FACULTY_INVITE_CODE` / `ADMIN_INVITE_CODE` regularly and distribute out-of-band
- [ ] Confirm Supabase Storage bucket `certificates` remains **private**
- [ ] Review RLS policies after any schema change — the application layer should never be the only line of defense
- [ ] Restrict `SUPABASE_SERVICE_ROLE_KEY` usage to server-only code paths (never bundle into client JS)
- [ ] Monitor the Admin Audit Log and Security Center regularly for anomalous login/verification activity
- [ ] Enforce HTTPS and secure cookie settings in your hosting environment

---

## 📜 License

Internal / institutional use. Adapt licensing terms as appropriate for your organization.