# Security & Data Privacy Policy

This document defines the security controls, Row Level Security (RLS) policies, authentication rules, and data minimisation principles for SkilleTreeOSS.

---

## 1. Authentication

### Providers

SkilleTreeOSS uses **Supabase Auth** for identity management. Two OAuth providers are configured in the Supabase Dashboard:

| Provider | Scope Requested | Data Used |
|----------|----------------|-----------|
| GitHub (identity) | `read:user`, `user:email` | `email`, `user_metadata.preferred_username` → `display_name` |
| Google | `openid`, `email`, `profile` | `email`, `given_name + family_name` → `display_name` |

> **Note:** There are *two separate* GitHub integrations:
> - **GitHub OAuth (identity)** — signs users in via Supabase. Minimal `read:user` scope only. No repository access.
> - **GitHub OAuth App (contribution)** — separate app with `repo` scope, used only for submitting trees as PRs from the builder. Stored in `github_connections` table (server-side only).

### Data Minimisation

Only the following fields are read from OAuth payloads:

```typescript
// In Supabase auth callback
const { email, user_metadata } = session.user
const display_name =
  user_metadata.preferred_username ||   // GitHub
  user_metadata.full_name ||            // Google
  email.split('@')[0]                   // fallback
```

What is **NOT** stored or requested:
- OAuth access tokens (Supabase manages these internally; we never persist them)
- GitHub private repository access
- Avatar URLs (not stored — display name only)
- Phone numbers, birth dates, or any other PII beyond email + display name
- GitHub contribution graphs, followers, or any profile data beyond username

### Session Management

- Sessions are managed by the **Supabase SSR client** using HTTP-only cookies.
- `middleware.ts` calls `supabase.auth.getUser()` on every request, which validates and silently refreshes the session cookie.
- Session cookies are `HttpOnly`, `Secure`, and `SameSite=Lax`.
- Unauthenticated requests to protected routes (`/dashboard`, `/api/*` mutating routes) are rejected at the middleware layer before any business logic executes.

```typescript
// middleware.ts — session refresh pattern
export async function middleware(request: NextRequest) {
  const { supabase, response } = createMiddlewareClient({ req: request, res: NextResponse.next() })
  const { data: { session } } = await supabase.auth.getSession()

  if (!session && protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return response
}
```

---

## 2. Row Level Security (RLS)

RLS is **enabled on every user-data table**. Anonymous/unauthenticated users cannot read or write any user data. Below are the exact policy definitions.

### `user_progress`

```sql
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users can read only their own progress
CREATE POLICY "user_progress_select_own"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own progress row
CREATE POLICY "user_progress_insert_own"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own progress row
CREATE POLICY "user_progress_update_own"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- No DELETE policy — progress rows are never deleted (use reset: update to empty array)
```

### `tree_ratings`

```sql
ALTER TABLE tree_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone (authenticated) can read aggregate ratings
CREATE POLICY "tree_ratings_select_all"
  ON tree_ratings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can insert their own rating
CREATE POLICY "tree_ratings_insert_own"
  ON tree_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own rating
CREATE POLICY "tree_ratings_update_own"
  ON tree_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### `resource_feedback`

```sql
ALTER TABLE resource_feedback ENABLE ROW LEVEL SECURITY;

-- Users can read their own votes
CREATE POLICY "resource_feedback_select_own"
  ON resource_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own vote
CREATE POLICY "resource_feedback_insert_own"
  ON resource_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update (change vote) only their own row
CREATE POLICY "resource_feedback_update_own"
  ON resource_feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### `resource_suggestions`

```sql
ALTER TABLE resource_suggestions ENABLE ROW LEVEL SECURITY;

-- Users can read their own suggestions
CREATE POLICY "resource_suggestions_select_own"
  ON resource_suggestions FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can submit suggestions
CREATE POLICY "resource_suggestions_insert_own"
  ON resource_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users cannot update or delete suggestions once submitted
-- (status workflow is managed server-side via service role)
```

### `site_stats`

```sql
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;

-- Public read — O(1) landing page stat
CREATE POLICY "site_stats_select_public"
  ON site_stats FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE for users — maintained by Postgres trigger only
```

### `github_connections` (Builder feature)

```sql
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;

-- Users can only read their own GitHub connection
CREATE POLICY "github_connections_select_own"
  ON github_connections FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own connection
CREATE POLICY "github_connections_insert_own"
  ON github_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update (re-auth) their own connection
CREATE POLICY "github_connections_update_own"
  ON github_connections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can disconnect (delete) their own connection
CREATE POLICY "github_connections_delete_own"
  ON github_connections FOR DELETE
  USING (auth.uid() = user_id);
```

> **Critical:** The `github_access_token` column in `github_connections` is **never returned to the client**. API routes use the `SUPABASE_SERVICE_ROLE_KEY` to read it server-side only, then discard it after the GitHub API call.

---

## 3. API Route Authentication

All mutating API routes validate the Supabase session **server-side** before touching the database. The pattern used in every `POST`/`DELETE` route:

```typescript
// Standard auth guard in every API route
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ... safe to proceed, user.id is authenticated
}
```

API routes that accept `user_id` in the request body **ignore it** — they always use `user.id` from the verified session instead, preventing ID spoofing.

### Route Auth Requirements

| Method | Path | Auth Required |
|--------|------|--------------|
| `POST` | `/api/progress/update` | ✅ Required |
| `POST` | `/api/resources/upvote` | ✅ Required |
| `POST` | `/api/ratings/upsert` | ✅ Required |
| `POST` | `/api/suggestions/create` | ✅ Required |
| `GET` | `/api/github/status` | ✅ Required |
| `GET` | `/api/github/connect` | ✅ Required |
| `GET` | `/api/github/callback` | ✅ (state JWT) |
| `DELETE` | `/api/github/disconnect` | ✅ Required |
| `POST` | `/api/builder/submit` | Optional (anonymous supported) |

---

## 4. GitHub Contribution Security

### Bot Token (Anonymous Submissions)

- `GITHUB_BOT_TOKEN` is a GitHub Personal Access Token scoped to `contents:write` and `pull_requests:write` on the `nasimstg/SkillTreeOSS` repository only.
- It is stored as a Vercel environment secret (server-side only).
- It is **never exposed** in client-side code or API responses.
- The bot account has no other repository access.

### User OAuth Token (GitHub-Connected Submissions)

- GitHub OAuth App uses `repo` scope (required for fork + PR creation).
- Tokens are stored encrypted in `github_connections.github_access_token`.
- Tokens are read server-side only (via service role) and used immediately for the GitHub API call — they are never logged or returned to the client.
- Users can revoke the connection at any time via the Navbar → "Disconnect GitHub" flow (deletes the `github_connections` row; user must also revoke the OAuth App from their GitHub settings).

### State Parameter (CSRF Protection)

The GitHub OAuth connect flow uses a signed JWT as the `state` parameter to prevent CSRF attacks:

```typescript
// GET /api/github/connect
const state = await signJWT({ userId: user.id, exp: Date.now() + 600_000 }) // 10 min TTL
const url = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&state=${state}&scope=repo`
```

The callback validates the `state` JWT signature before exchanging the code for a token.

---

## 5. Input Validation & Injection Prevention

- All user-supplied content written to the database goes through **parameterised Supabase queries** (never string concatenation). Supabase's client library uses the PostgREST API with proper escaping.
- Tree JSON submitted via the builder is:
  1. Parsed with `JSON.parse()` (not `eval`)
  2. Validated against the Zod `SkillTreeSchema`
  3. Base64-encoded before sending to GitHub API (no shell interpolation)
- The builder never executes user-supplied content as code.
- Resource URLs are validated to start with `https://` both client-side and server-side before being stored or displayed.

---

## 6. Environment Variable Security

| Variable | Exposure | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Safe — public by design |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + Server | Safe — RLS enforces access |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Never in `NEXT_PUBLIC_*`; bypasses RLS — only for admin operations |
| `GITHUB_BOT_TOKEN` | Server only | Never exposed to client |
| `GITHUB_CLIENT_ID` | Server only | Used only in redirect URL construction |
| `GITHUB_CLIENT_SECRET` | Server only | Never exposed |

`NEXT_PUBLIC_*` variables are bundled into client-side JavaScript. Only variables that are safe to expose publicly use this prefix. All secrets use server-only names (no `NEXT_PUBLIC_` prefix).

---

## 7. Data Retention & User Rights

- **Progress data:** Users can reset their progress at any time from the `/dashboard` "Reset Progress" button, which sets `completed_node_ids = []` for all their `user_progress` rows.
- **Account deletion:** When a user's auth account is deleted from Supabase, all associated rows in `user_progress`, `tree_ratings`, `resource_feedback`, `resource_suggestions`, and `github_connections` are automatically cascade-deleted via `ON DELETE CASCADE` foreign key constraints.
- **No analytics tracking:** SkilleTreeOSS does not include third-party analytics scripts. The only aggregate data stored is the `site_stats` singleton (total learners, total nodes unlocked) — which cannot be reverse-engineered to individual users.
- **No advertising:** No user data is shared with third parties for advertising purposes.
