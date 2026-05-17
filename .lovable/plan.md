## Finding: "Anyone can read all rows in your profiles data"

**Verdict: false positive — no code changes needed.**

### Why this is not exploitable

The scanner flagged `src/pages/Analytics.tsx:41` based on code patterns alone (it explicitly says "Unverified — connect Supabase to confirm"). With the actual backend config in mind:

1. **Page is admin-gated server-side.** Before any query runs, `Analytics.tsx` calls `supabase.rpc("has_role", { _user_id, _role: "admin" })`. Non-admins are redirected to `/`. The `has_role` RPC is a `SECURITY DEFINER` function checking the `user_roles` table — it cannot be bypassed from the client.

2. **RLS on `profiles` enforces the same rule at the database layer.** Even if someone called the query directly:
   - `Users can view own profile` → `auth.uid() = user_id`
   - `Admins can view all profiles` → `has_role(auth.uid(), 'admin')`
   
   A non-admin signed-in user only ever gets their own row back. Anonymous users get nothing.

3. **Only `id` is selected**, not display_name / avatar_url / email. The query is used solely to compute `totalUsers` count for the admin dashboard.

### Action

Mark the finding as ignored with a clear reason, and update the security memory so future scans don't re-flag the same intentional admin-only aggregate.

### Plan

1. Call `security--manage_security_finding` with `operation: "ignore"` for `missing-user-filter-rls`, explaining the admin gate + RLS protection.
2. Call `security--update_memory` to record that `Analytics.tsx` is admin-only and that aggregate reads of `profiles.id` / `distro_configs` from that page are intentional and protected by both UI gate and RLS.

No source files will be modified.