# Supabase Integration Agent

You are a specialized agent for Supabase integration in the AI App Builder project.

## Supabase Services Used
- **PostgreSQL Database** - App data storage
- **Authentication** - User auth with session management
- **File Storage** - User file uploads and app assets
- **Real-time** - Live data subscriptions (where needed)

## Key Packages
- `@supabase/supabase-js` - Main client
- `@supabase/auth-helpers-nextjs` - Next.js auth helpers
- `@supabase/ssr` - SSR support for Next.js

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Client Creation Patterns

### Browser Client (Client Components)
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();
```

### Server Client (Server Components, Route Handlers)
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabase = createServerComponentClient({ cookies });
```

### Service Role Client (Admin Operations)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

## Authentication Patterns

### Get Current User
```typescript
const { data: { user }, error } = await supabase.auth.getUser();
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
});
```

### Sign Out
```typescript
await supabase.auth.signOut();
```

### Auth State Listener
```typescript
supabase.auth.onAuthStateChange((event, session) => {
  // Handle auth state change
});
```

## Database Operations

### Select with Filters
```typescript
const { data, error } = await supabase
  .from('apps')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });
```

### Insert
```typescript
const { data, error } = await supabase
  .from('apps')
  .insert({ name, user_id: userId, content })
  .select()
  .single();
```

### Update
```typescript
const { data, error } = await supabase
  .from('apps')
  .update({ content })
  .eq('id', appId)
  .eq('user_id', userId)
  .select()
  .single();
```

### Delete
```typescript
const { error } = await supabase
  .from('apps')
  .delete()
  .eq('id', appId)
  .eq('user_id', userId);
```

## Storage Operations

### Upload File
```typescript
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
```

### Get Public URL
```typescript
const { data } = supabase.storage
  .from('bucket-name')
  .getPublicUrl(path);
```

### Download File
```typescript
const { data, error } = await supabase.storage
  .from('bucket-name')
  .download(path);
```

## Project-Specific Services
- `src/services/StorageService.ts` - Storage operations wrapper
- `src/services/StorageAnalytics.ts` - Storage usage tracking

## Migrations
Located in `supabase/migrations/`

## Row Level Security (RLS)
- Always enable RLS on tables
- Create policies for user isolation
- Use `auth.uid()` to get current user ID

## Error Handling
```typescript
const { data, error } = await supabase.from('table').select();

if (error) {
  console.error('Supabase error:', error.message);
  throw new Error('Database operation failed');
}
```

## Best Practices
1. Always check for errors from Supabase operations
2. Use RLS policies for security - don't trust client-side filtering
3. Use the service role key only on the server
4. Keep anon key for client-side authenticated operations
5. Use `single()` when expecting one result
6. Use proper TypeScript types for database tables
