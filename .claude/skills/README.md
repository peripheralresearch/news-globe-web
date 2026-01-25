# Web App Skills Library

Skills for the Next.js web application.

## Available Skills

| Skill | Purpose | When to Use |
|-------|---------|-------------|
| [vercel-cli](./vercel-cli/SKILL.md) | Vercel deployment and env management | Deploying, managing env vars |
| [venezuela-page](./venezuela-page/SKILL.md) | Venezuela map/video/timeline UI | Map behavior, markers, video overlay |
| [supabase-stories](./supabase-stories/SKILL.md) | Query stories + news items | Finding stories, entity lookups |
| [supabase-videos](./supabase-videos/SKILL.md) | Video pin management | Adding/updating video positions |
| [seo-article-pages](./seo-article-pages/SKILL.md) | SEO for article pages | Metadata, JSON-LD, SSR |
| [hydration-timezones](./hydration-timezones/SKILL.md) | Prevent hydration errors | Date/time formatting |

## Skill Template

Each `SKILL.md` follows this structure:

```markdown
# Skill Name

## Purpose
What this skill accomplishes.

## When to Use / Triggers
Conditions that indicate this skill should be applied.

## Inputs Required
Information needed before starting.

## Step-by-Step Workflow
1. Step one
2. Step two
...

## Output / Done Criteria
How to know the work is complete.

## Pitfalls / Gotchas
Common mistakes to avoid.

## Example Tasks
Concrete examples of applying this skill.
```

## Quick Selection Guide

**Modifying the Venezuela page?**
- UI/Map/Timeline changes -> `venezuela-page`
- Fetching stories -> `supabase-stories`
- Video markers/positions -> `supabase-videos`
- SEO improvements -> `seo-article-pages`
- Date formatting bugs -> `hydration-timezones`

**Debugging hydration errors?**
-> Start with `hydration-timezones`

**Adding new article pages?**
-> Use `seo-article-pages` for structure, then `hydration-timezones` for dates

**Querying Supabase?**
- Stories/news items -> `supabase-stories`
- Videos/positions -> `supabase-videos`

**Deploying to Vercel?**
-> `vercel-cli`
