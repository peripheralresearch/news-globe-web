# Multi-User Live Articles Architecture

## Overview
This document outlines how to structure a multi-user system where users can create and edit their own "live articles" with video pins on maps.

## Database Schema

### Core Tables

```sql
-- Users table (managed by Supabase Auth)
-- Automatically created when using Supabase Auth

-- Articles table
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country_code VARCHAR(3), -- ISO 3166-1 alpha-3 (VEN, IRN, etc.)
  is_published BOOLEAN DEFAULT false,
  is_live BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Videos table (updated)
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id TEXT UNIQUE NOT NULL, -- YouTube/external ID
  title TEXT,
  channel_name TEXT,
  description TEXT,
  video_url TEXT,
  source_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  upload_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Article collaborators (optional - for shared editing)
CREATE TABLE article_collaborators (
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT CHECK (permission_level IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (article_id, user_id)
);
```

## Row Level Security (RLS) Policies

### Enable RLS on all tables
```sql
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_collaborators ENABLE ROW LEVEL SECURITY;
```

### Articles Policies
```sql
-- Users can view published articles or their own
CREATE POLICY "View articles" ON articles FOR SELECT
  USING (
    is_published = true
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM article_collaborators
      WHERE article_id = articles.id
      AND user_id = auth.uid()
    )
  );

-- Users can create their own articles
CREATE POLICY "Create own articles" ON articles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own articles
CREATE POLICY "Update own articles" ON articles FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM article_collaborators
      WHERE article_id = articles.id
      AND user_id = auth.uid()
      AND permission_level IN ('editor', 'admin')
    )
  );

-- Users can delete their own articles
CREATE POLICY "Delete own articles" ON articles FOR DELETE
  USING (user_id = auth.uid());
```

### Videos Policies
```sql
-- View videos from viewable articles
CREATE POLICY "View videos" ON videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = videos.article_id
      AND (
        articles.is_published = true
        OR articles.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM article_collaborators
          WHERE article_id = articles.id
          AND user_id = auth.uid()
        )
      )
    )
  );

-- Create videos for own articles
CREATE POLICY "Create videos" ON videos FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_id
      AND (
        articles.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM article_collaborators
          WHERE article_id = articles.id
          AND user_id = auth.uid()
          AND permission_level IN ('editor', 'admin')
        )
      )
    )
  );

-- Update videos in own articles
CREATE POLICY "Update videos" ON videos FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = videos.article_id
      AND (
        articles.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM article_collaborators
          WHERE article_id = articles.id
          AND user_id = auth.uid()
          AND permission_level IN ('editor', 'admin')
        )
      )
    )
  );

-- Delete videos from own articles
CREATE POLICY "Delete videos" ON videos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = videos.article_id
      AND articles.user_id = auth.uid()
    )
  );
```

## Implementation Guide

### 1. Authentication Setup

```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const supabaseClient = () => createClientComponentClient()
export const supabaseServer = () => createServerComponentClient({ cookies })
```

### 2. Middleware for Auth

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protect /articles/new and /articles/*/edit routes
  if (req.nextUrl.pathname.match(/\/articles\/(new|.*\/edit)/)) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return res
}

export const config = {
  matcher: ['/articles/:path*']
}
```

### 3. Article Management Pages

```typescript
// app/articles/new/page.tsx
export default async function NewArticlePage() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Form to create new article
  // On submit: POST to /api/articles
}

// app/articles/[slug]/edit/page.tsx
export default async function EditArticlePage({ params }) {
  const supabase = supabaseServer()
  const { data: article } = await supabase
    .from('articles')
    .select('*, videos(*)')
    .eq('slug', params.slug)
    .single()

  // Check if user can edit
  const { data: { user } } = await supabase.auth.getUser()
  if (article.user_id !== user?.id) {
    // Check collaborators
    // If not authorized, redirect
  }

  // Render edit interface with map and video management
}
```

### 4. API Routes with Proper Auth

```typescript
// app/api/articles/[id]/videos/[videoId]/position/route.ts
export async function PATCH(request: Request, { params }) {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user owns the article or is a collaborator
  const { data: article } = await supabase
    .from('articles')
    .select('user_id')
    .eq('id', params.id)
    .single()

  if (article?.user_id !== user.id) {
    // Check if user is collaborator with edit permissions
    const { data: collab } = await supabase
      .from('article_collaborators')
      .select('permission_level')
      .eq('article_id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!collab || collab.permission_level === 'viewer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  // Update video position
  const { latitude, longitude } = await request.json()
  const { error } = await supabase
    .from('videos')
    .update({ latitude, longitude, updated_at: new Date().toISOString() })
    .eq('id', params.videoId)
    .eq('article_id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

## URL Structure

```
/                           # Homepage
/articles                   # Browse all published articles
/articles/new              # Create new article (auth required)
/articles/venezuela        # View article (if published or owner)
/articles/venezuela/edit   # Edit article (owner/collaborator only)
/profile                   # User's own articles
/login                     # Auth page
```

## Key Features

1. **Ownership**: Each article belongs to a user
2. **Collaboration**: Optional - users can invite others as editors
3. **Privacy**: Articles can be draft or published
4. **RLS**: Database-level security ensures data isolation
5. **Audit Trail**: Track who created/modified what

## Migration from Current System

1. Create a default "admin" user for existing content
2. Assign all current videos to initial articles
3. Migrate video positions to new schema
4. Enable RLS policies
5. Update API routes to check authentication

## Security Best Practices

1. **Never expose service role key** to frontend
2. **Always use RLS** for user data
3. **Validate ownership** in API routes
4. **Use prepared statements** to prevent SQL injection
5. **Implement rate limiting** for API endpoints
6. **Add CORS protection** for API routes
7. **Log all modifications** for audit trail

## Example User Flow

1. User signs up/logs in via Supabase Auth
2. User creates new article (e.g., "Venezuela Crisis 2024")
3. User adds videos to the article
4. User drags pins to position videos on map
5. User can save as draft or publish
6. Published articles appear on public feed
7. User can invite collaborators to help edit