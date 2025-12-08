# User Deployment Features - Implementation Plan

> Save this for when you're ready to implement. No rush!

## Overview

Two features to let users share and deploy their generated apps with zero friction:

1. **Instant Preview URLs** - Shareable links like `/preview/abc123`
2. **One-Click Deploy to Vercel** - OAuth-based deployment

---

## Design Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Preview persistence | Permanent | Users share portfolio pieces, links shouldn't break |
| Deploy platform | Vercel first | Best Next.js support, simplest for users |
| Preview rendering | Client-side Sandpack | Zero infrastructure cost, reuses existing code |
| Share UX | One-click toggle | No configuration needed |

---

## Phase 1: Instant Preview URLs

### Database Migration (Run in Supabase SQL Editor)

```sql
-- Add preview fields to generated_apps
ALTER TABLE generated_apps
  ADD COLUMN IF NOT EXISTS preview_slug VARCHAR(12) UNIQUE,
  ADD COLUMN IF NOT EXISTS preview_enabled BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_preview_slug
  ON generated_apps(preview_slug) WHERE preview_slug IS NOT NULL;

-- RLS policy: anyone can view public apps
CREATE POLICY "Public preview access" ON generated_apps
  FOR SELECT USING (is_public = true AND preview_enabled = true);
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/app/preview/[slug]/page.tsx` | Public preview page |
| `src/app/preview/[slug]/layout.tsx` | Minimal layout for previews |
| `src/app/api/preview/[slug]/route.ts` | GET public app data |
| `src/app/api/apps/[id]/share/route.ts` | POST to share, DELETE to unshare |
| `src/components/modals/ShareModal.tsx` | Toggle public, copy link |
| `src/components/preview/PreviewBanner.tsx` | "Built with AI App Builder" footer |

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/supabase.ts` | Add `preview_slug`, `preview_enabled` |
| `src/hooks/useDatabaseSync.ts` | Handle new fields |
| `src/components/AIBuilder.tsx` | Add Share button |
| `src/components/modals/LibraryModal.tsx` | Add share icon to cards |
| `src/middleware.ts` | Allow `/preview/*` without auth |

### Implementation Steps

1. Run SQL migration in Supabase
2. Update TypeScript types
3. Create `/api/preview/[slug]` route
4. Create `/api/apps/[id]/share` route
5. Create preview page + layout
6. Create ShareModal component
7. Add share buttons to UI
8. Test end-to-end

---

## Phase 2: One-Click Deploy to Vercel

### Prerequisites

1. Create Vercel OAuth app at https://vercel.com/account/integrations
2. Get `VERCEL_CLIENT_ID` and `VERCEL_CLIENT_SECRET`

### Environment Variables

```bash
VERCEL_CLIENT_ID=your_client_id
VERCEL_CLIENT_SECRET=your_client_secret
VERCEL_REDIRECT_URI=https://yourapp.com/api/integrations/vercel/callback
TOKEN_ENCRYPTION_KEY=32_byte_random_key
```

### Database Migration

```sql
CREATE TABLE user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  provider VARCHAR(20) NOT NULL,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  account_id VARCHAR(100),
  account_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own integrations" ON user_integrations
  FOR ALL USING (auth.uid() = user_id);
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/services/TokenEncryption.ts` | Encrypt/decrypt OAuth tokens |
| `src/services/DeploymentService.ts` | Prepare files, call Vercel API |
| `src/hooks/useDeployment.ts` | Manage deployment state |
| `src/app/api/integrations/vercel/authorize/route.ts` | Start OAuth |
| `src/app/api/integrations/vercel/callback/route.ts` | Handle callback |
| `src/app/api/integrations/status/route.ts` | Check connection status |
| `src/app/api/deploy/vercel/route.ts` | Deploy app |

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/supabase.ts` | Add `user_integrations` table |
| `src/components/modals/DeploymentModal.tsx` | Add connect + deploy buttons |

### Implementation Steps

1. Create Vercel OAuth app (manual)
2. Add environment variables
3. Run SQL migration
4. Create TokenEncryption service
5. Create OAuth routes
6. Create DeploymentService
7. Create deploy API route
8. Create useDeployment hook
9. Redesign DeploymentModal
10. Test end-to-end

---

## Dependencies to Add

```bash
npm install nanoid
```

---

## User Journeys

### Sharing (2 clicks)
1. User clicks "Share" button
2. Toggles "Make Public" → copies link
3. Anyone can view at `/preview/abc123`

### Deploying (3 clicks)
1. User clicks "Deploy"
2. Connects Vercel (one-time OAuth)
3. Clicks "Deploy Now" → gets live URL

---

## Security Checklist

- [ ] RLS ensures only public apps accessible via preview
- [ ] Validate user owns app before sharing/deploying
- [ ] CSRF protection in OAuth flow (state param)
- [ ] Encrypt tokens at rest (AES-256-GCM)
- [ ] No secrets in client-side code

---

## Notes

- Preview uses existing `PowerfulPreview.tsx` Sandpack component
- Existing `is_public` field finally gets used
- ZIP export remains as fallback option
- Can add Netlify later with same pattern
