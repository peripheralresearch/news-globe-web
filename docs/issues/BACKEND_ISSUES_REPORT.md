# Backend Issues Consolidated Report

**Report Date:** 2026-01-17
**Project:** Sentinel (zghbrwbfdoalgzpcnbcm)
**Scope:** ETL Pipeline, Data Quality, Query Logic Issues
**Target Audience:** Backend/ETL Development Team

---

## Executive Summary

This report consolidates findings from four separate investigations into backend system issues. Two critical issues have been identified:

1. **Issue #1 - Duplicate Stories Pipeline Defect (HIGH SEVERITY)**
   - 43% of OSINTdefender stories are duplicates
   - Root cause: Story aggregation logic creates new records instead of aggregating news items
   - Affects: Data quality, user experience, analytics accuracy
   - **Action Required:** Backend code changes + data cleanup

2. **Issue #2 - Country Filtering False Positives (MEDIUM SEVERITY)**
   - 7.5% false positive rate on country queries
   - Root cause: Substring matching includes unintended locations
   - Affects: Query results, user experience
   - **Action Required:** Both frontend and ETL improvements

3. **Issue #3 - Country Semantic Role Problem (MEDIUM SEVERITY)**
   - Users get stories mentioning a country instead of events in that country
   - Root cause: NLP doesn't distinguish semantic roles (event location vs topic mention)
   - Affects: Country-specific query relevance
   - **Action Required:** Data schema enhancement + NLP pipeline improvements

---

## Table of Contents

- [Issue #1: Duplicate Stories Pipeline Defect](#issue-1-duplicate-stories-pipeline-defect)
- [Issue #2: Country Filtering False Positives](#issue-2-country-filtering-false-positives)
- [Issue #3: Country Semantic Role Distinction](#issue-3-country-semantic-role-distinction)
- [Database Schema Reference](#database-schema-reference)
- [Testing & Validation Queries](#testing--validation-queries)
- [Immediate Action Items](#immediate-action-items)
- [Contact & Resources](#contact--resources)

---

## Issue #1: Duplicate Stories Pipeline Defect

### Severity: HIGH
**Impact:** Data quality issue affecting 43% of stories from OSINTdefender source
**User Experience:** Multiple identical stories appearing as separate entries
**Root Cause:** Story aggregation logic failure

---

### The Problem

The system creates new story records for individual news items instead of aggregating them into existing stories with matching titles. This results in:

- Multiple story records with identical titles
- Each story containing different news items (not duplicates at data level)
- Scattered related content across many story IDs
- Wasted database space and bloated story counts

### Evidence

#### Pattern 1: "#Iran" Stories (14 Duplicate Stories)

**Scale:** 14 separate story records with identical title "#Iran "
**Created:** Dec 22, 2025 - Jan 11, 2026 (span of 20 days)

Example Story IDs:
- `497fe8a3-1a95-443e-9a59-fbf430c531f1` (2026-01-11)
- `8070e6e2-9abf-4821-a473-b5a9eb56cadc` (2026-01-10)
- `11080b37-27ea-415a-a2ba-af1b55aaaaa4` (2026-01-10)
- `7f94f1f3-29b5-4e2d-a667-436e3c190595` (2026-01-06 10:42:38)
- `ab9d49b3-cadc-4f87-9ec6-bfe7aa62a41b` (2026-01-06 10:43:28) ← 50 seconds after above

**Key Finding:** Stories `7f94f1f3` and `ab9d49b3` were created 50 seconds apart. Each contains a different news item. This proves **concurrent processing without deduplication**, not batch testing.

| Story ID | Created | News Items | Source | Anomalies |
|----------|---------|------------|--------|-----------|
| 7f94f1f3 | 2026-01-06 10:42:38 | 1 | OSINTdefender | Created 50s before next |
| ab9d49b3 | 2026-01-06 10:43:28 | 1 | OSINTdefender | Duplicate title, different news |
| 8070e6e2 | 2026-01-10 20:57:41 | 1 | OSINTdefender | Created 10m after 11080b37 |
| 0a6574d5 | 2026-01-02 01:56:51 | **0** | **NONE** | Orphan story - no news items |

#### Pattern 2: "Iranian President Pezeshkian:" Stories (5 Duplicate Stories)

**Scale:** 5 story records with identical title
**Created:** Jan 1, 6-7, 2026
**Source:** Clash Report

| Story ID | Created | News Items | Notes |
|----------|---------|------------|-------|
| c7a766db | 2026-01-01 11:09:52 | 4 | First story (canonical) |
| d9922c24 | 2026-01-06 10:22:19 | 1 | 5 days later + 26 min before next |
| e52f887e | 2026-01-06 10:27:37 | 1 | 5 min after d9922c24 |
| 2e753409 | 2026-01-06 10:48:09 | 1 | 26 min after first, within same hour |
| 22019565 | 2026-01-07 09:32:20 | 1 | Day later |

**Critical Finding:** Three stories created within 26 minutes (10:22, 10:27, 10:48). Different news items, identical titles. **This is the pipeline processing multiple news items with same title and creating separate stories instead of aggregating.**

#### Pattern 3: Gold Coin Stories (Duplicates within variation)

**Scale:** 4 stories with "scales up in price" + 3 with "downturns in price"
**Assessment:** Mixed - Some are legitimate (daily price updates), but duplicates exist within each variant.

---

### Root Cause Analysis

#### Primary Cause: Missing Deduplication Logic

**Where it happens:**
1. News item arrives with a title
2. System checks if story with matching title exists
3. **DEFECT:** No check OR check fails due to race condition
4. New story is created instead of adding news item to existing story

**Evidence this is a bug, not testing:**
- ❌ No test keywords found ("test", "dev", "staging")
- ❌ Spread across 20+ days (not batch testing)
- ❌ Random UUIDs (not sequential)
- ❌ Affects production sources (OSINTdefender, Clash Report)
- ❌ 43% of one source's stories affected (systematic, not isolated)
- ✅ Concurrent creation patterns (50 sec, 5 min gaps) suggest race condition

#### Secondary Cause: Concurrent Processing Without Safeguards

The 50-second and 5-minute gaps between duplicate creations indicate multiple pipeline workers processing news items simultaneously. Without proper locking or upsert patterns, this creates race conditions where:

1. Worker A checks for existing story with title "X" → Not found
2. Worker B checks for existing story with title "X" → Not found (concurrent)
3. Both workers create new stories (duplicate)

#### Tertiary Issue: Incomplete Story Objects

Most duplicate stories have:
- Empty summaries
- Empty descriptions
- No keywords (except 1 of 14)

This suggests story creation completes but enrichment logic fails or doesn't execute.

---

### Scale of Impact

**OSINTdefender Source:**
- Total stories: 290
- Unique titles: 166
- **Duplicate stories: 124 (43%)**
- Date range: Dec 13, 2025 - Jan 11, 2026

**Database Impact:**
- 14 duplicate "#Iran" stories
- 5 duplicate "Iranian President Pezeshkian" stories
- 7 duplicate gold coin stories
- Unknown count in other sources (Clash Report shows 5+ duplicates)

**User Experience Impact:**
- Users see multiple identical story titles
- Related news items scattered across many story IDs
- Analytics overstated (story counts inflated by 43%)

---

### Recommendations

#### Immediate Actions (Priority 1)

1. **Fix the Story Aggregation Logic**
   - Add pre-creation check: Does a story with this title already exist?
   - Use database `SELECT FOR UPDATE` for pessimistic locking
   - Or use `INSERT ... ON CONFLICT` (upsert pattern) for automatic deduplication
   - Implement transaction isolation to prevent race conditions

2. **Add Concurrent Processing Safeguards**
   - If using multiple worker threads/processes:
     - Implement distributed locking (Redis, DB locks)
     - Use SELECT FOR UPDATE when checking for existing stories
     - Consider deduplication key: `title + source + time_window`
   - Ensure story creation uses appropriate transaction isolation level

3. **Eliminate Orphan Stories**
   - Query: `SELECT * FROM story WHERE NOT EXISTS (SELECT 1 FROM news_item WHERE news_item.story_id = story.id)`
   - Investigate why story `0a6574d5` has zero news items
   - Add foreign key constraint or cascade delete to prevent future orphans

**Implementation Example:**
```sql
-- Use upsert pattern to prevent duplicates
INSERT INTO story (id, title, source_id, created, updated)
VALUES (gen_random_uuid(), 'Iranian President Pezeshkian:', 1, NOW(), NOW())
ON CONFLICT (title) DO UPDATE SET updated = NOW()
RETURNING id;
```

#### Data Cleanup (Priority 2)

1. **Merge "#Iran" Stories**
   - Keep earliest story by created timestamp
   - Move all news items from 13 duplicate stories to canonical story
   - Delete duplicate stories
   - Verify no orphans remain

2. **Merge "Iranian President" Stories**
   - Keep story `c7a766db` (has 4 news items)
   - Move news items from stories d9922c24, e52f887e, 2e753409, 22019565
   - Delete duplicates

3. **Merge Gold Coin Stories**
   - For "scales up in price" variant: keep first, merge 3 others
   - For "downturns in price" variant: keep first, merge 2 others

**Cleanup SQL Pattern:**
```sql
-- For each set of duplicates:
-- 1. Identify canonical story (earliest created)
-- 2. Move news items from duplicates to canonical
UPDATE news_item
SET story_id = 'CANONICAL_STORY_ID'
WHERE story_id IN ('DUPLICATE_1', 'DUPLICATE_2', ...);

-- 3. Delete duplicates
DELETE FROM story WHERE id IN ('DUPLICATE_1', 'DUPLICATE_2', ...);
```

#### Prevention (Priority 3)

1. **Add Validation Rules**
   - Pre-creation check: Verify story with title doesn't exist
   - Post-creation validation: No stories should have 0 news items
   - Periodic cleanup job: Auto-merge duplicates if created

2. **Add Monitoring**
   - Alert when duplicate titles created within short time window (< 1 hour)
   - Daily report of stories with duplicate titles
   - Track story creation rate vs news item ingestion rate

3. **Improve Story Title Generation**
   - If titles are derived from news items, add uniqueness constraints
   - Consider adding timestamp or source ID to title
   - Or implement semantic similarity-based deduplication (not just exact match)

---

## Issue #2: Country Filtering False Positives

### Severity: MEDIUM
**Impact:** 7.5% false positive rate on country queries
**Affected Queries:** `/api/stories/country/[country]`
**Root Cause:** Substring matching pattern

---

### The Problem

The country filtering query uses PostgreSQL `ILIKE '%CountryName%'` pattern, which matches ANY location name containing the country name as a substring.

**Example:** Query for "Iran" matches:
- `Miranda` (contains "ran")
- `Tirana` (contains "rana")
- `Guarapiranga dam` (contains "piran")
- `Antsiranana` (contains "rana")

Result: 13 false positive stories from Venezuela, Albania, Brazil, Azerbaijan, Indonesia, Madagascar.

### Evidence

#### Query Pattern Issue

**Current Query (PROBLEMATIC):**
```typescript
const { data: locations } = await supabase
  .from('entity_location')
  .select('id, name')
  .ilike('name', `%${country}%`)  // ← SUBSTRING MATCH
  .limit(50)
```

**Location Entities Matching '%Iran%':**

| Location ID | Location Name | Type | Actual Country | False Positive? |
|-------------|---------------|------|-----------------|-----------------|
| 462 | Iran | Country | Iran | ✓ Correct |
| 2743 | iran | null | Iran | ✓ Correct |
| 1190 | western Iran | Location | Iran | ✓ Correct |
| 6170 | Iranian capital | Location | Iran | ✓ Correct |
| 321 | Tirana | city | Albania | ✗ FALSE |
| 5704 | Miranda | null | Venezuela | ✗ FALSE |
| 1859 | Miranda State | null | Venezuela | ✗ FALSE |
| 3746 | Childiran | Location | Azerbaijan | ✗ FALSE |
| 6468 | Guarapiranga dam | Location | Brazil | ✗ FALSE |
| 2728 | Antsiranana | Location | Madagascar | ✗ FALSE |

**Total false positives: 13 stories from 8 non-Iran locations**

#### Problematic Stories

**Venezuela Story:**
- Title: "Venezuela's Caracas rocks with series of explosions"
- Story ID: `1a65e1f0-b6d8-4812-b0ff-dc42daae571d`
- Why it appears: Has "Miranda State" (rank=1) which matches `%Iran%`

**Albania Story:**
- Title: "Serbian President Aleksandar Vučić:"
- Story ID: `0f36c5e6-04f7-4392-8d18-444fe3d4db8c`
- Why it appears: Has "Tirana" (rank=1) which matches `%Iran%`

**Brazil Story:**
- Title: "Power cuts reported in São Paulo due to heavy rains"
- Story ID: `4ff152cb-e705-4566-94f0-1102fadc6900`
- Why it appears: Has "Guarapiranga dam" (rank=1) which matches `%Iran%`

#### False Positive Rate

**Iran Query Results:**
- Legitimate Iran stories: 161
- False positive stories: 13
- False positive rate: 13 / (161 + 13) = **7.5%**

This is LOW severity but OBVIOUS quality issue for users.

---

### Root Cause Analysis

#### Database Design: CORRECT ✓

The schema is well-designed with proper normalization:
- `entity_location` table with 8,916 location entities
- `location_type` field (Country, city, Location, Address, region, landmark, neighborhood)
- `entity_country` table with 205 canonical countries
- `story_entity_location` junction table with rank/confidence

#### ETL Process: CORRECT ✓

The entity extraction correctly identifies multiple locations in stories and assigns appropriate ranks. No ETL issues found.

#### Query Pattern: PROBLEMATIC ✗

The frontend API uses substring matching which is too broad:
- Doesn't filter by `location_type`
- Matches partial strings
- Allows false positives to propagate downstream

---

### Recommendations

#### Immediate Fix (Frontend Only)

**Change in `/app/api/stories/country/[country]/route.ts`:**

```typescript
// BEFORE (lines 26-30)
const { data: locations } = await supabase
  .from('entity_location')
  .select('id, name')
  .ilike('name', `%${country}%`)
  .limit(50)

// AFTER
const { data: locations } = await supabase
  .from('entity_location')
  .select('id, name')
  .ilike('name', country)  // Exact match (case-insensitive)
  .in('location_type', ['Country', 'country'])
  .limit(10)
```

**Impact:**
- Eliminates all 13 false positives
- Reduces query from 17 matched locations to 1-2
- Matches only actual country entities
- No database changes required
- Ready to deploy immediately

#### Long-term Improvements (ETL Team)

1. **Populate story_entity_country Table**
   - Currently empty (0 rows)
   - Extract country-level relationships from stories
   - Use entity_country as authoritative source
   - Enables robust country queries via ISO codes

   ```sql
   INSERT INTO story_entity_country (story_id, country_id, rank, confidence)
   SELECT
     sel.story_id,
     ec.id as country_id,
     sel.rank,
     sel.confidence
   FROM story_entity_location sel
   JOIN entity_location el ON sel.location_id = el.id
   JOIN entity_country ec ON el.name ILIKE ec.name
     OR el.name = ANY(ec.aliases)
   WHERE el.location_type IN ('Country', 'country');
   ```

2. **Normalize location_type Values**
   - Currently inconsistent: "Country" vs "country"
   - Standardize to single case (recommend uppercase)
   - Consider enum constraint: `CREATE TYPE location_type_enum AS ENUM ('Country', 'City', 'Region', ...)`

3. **Add Country Hierarchy**
   - Add `country_id` foreign key to `entity_location`
   - Link cities/regions to parent countries
   - Enables hierarchical queries: "Tirana" → Albania

---

## Issue #3: Country Semantic Role Distinction

### Severity: MEDIUM
**Impact:** Country queries return overly broad results (20-30% false positives)
**Affected Experience:** Users expect "events in Iran" but get "stories mentioning Iran"
**Root Cause:** NLP doesn't distinguish semantic roles

---

### The Problem

When users query `/api/stories/country/Iran`, they expect stories where events **HAPPENED IN** Iran. Instead, they get stories that simply **MENTION** Iran in analysis:

**What Users Expect:**
- "Protests erupt in Tehran, Iran" ✓
- "At least 544 killed in Iran protests" ✓
- "Iran Supreme Leader makes statement" ✓

**What Users Actually Get:**
- "EU-Mercosur deal to be signed in Asunción" (mentions 19 countries including Iran)
- "BBC speaks to Greenlanders about Trump's threats" (mentions 12 countries in foreign policy analysis)
- "Global analysis of Trump's imperialist military" (analysis mentioning Iran alongside Venezuela, Syria)

### Evidence

#### Story Examples

**Story c1: "EU-Mercosur Deal to be Signed in Asunción"**
- Story ID: `58e05fbd-f050-4eb1-87a5-2730df6bf18d`
- Event Location: Asunción, Paraguay
- Rank=1 Locations: 19 countries (Paraguay, Uruguay, Argentina, Brazil, France, Poland, Ireland, Ukraine, Austria, **Iran**, Belgium, Hungary, Russia, Washington DC, Brussels, etc.)
- Problem: Iran mentioned as part of global geopolitical context, not event location

**Story c2: "BBC Speaks to Greenlanders About Trump's Threats"**
- Story ID: `8628bf90-10ec-4913-9b51-a1dbc93c5b99`
- Event Location: Greenland
- Rank=1 Locations: 12 countries (Greenland, Denmark, Venezuela, Syria, Yemen, Somalia, Iraq, Nigeria, **Iran**, Colombia, etc.)
- Problem: Iran mentioned in foreign policy discussion context

#### Database Analysis

**Stories with Multiple Rank=1 Locations:**
- Total stories: ~9,000
- Stories with rank=1 locations: 8,962
- Stories with MULTIPLE rank=1 locations: 3,323 (37%)

This shows the system assigns rank=1 to multiple contexts per story (BY DESIGN), but doesn't distinguish WHY each location is included.

---

### Root Cause Analysis

#### Semantic Role Problem

The NLP entity extraction system identifies **WHICH** countries are mentioned but not **WHY**:

| Role | Example | Current Handling | Desired Handling |
|------|---------|------------------|------------------|
| **Event Location** | "Protests **in** Tehran" | rank=1 | Should be primary (rank=0 or role='event_location') |
| **Primary Topic** | "Analysis of Iran's economy" | rank=1 | Should be secondary (rank=2-3 or role='primary_topic') |
| **Comparative Reference** | "Unlike Iran, Brazil..." | rank=1 | Should be tertiary (rank=4+ or role='mentioned') |
| **Mentioned in Context** | "Iran alongside 10 other countries" | rank=1 | Should be ignored or filtered (role='context') |

**Current System:** All treated equally as rank=1

**Needed:** Semantic role classification

---

### Recommendations

#### Option 1: Add Semantic Role Field (RECOMMENDED - Future)

**Schema Change:**
```sql
-- Create enum for location roles
CREATE TYPE location_role AS ENUM (
  'event_location',    -- Where event physically occurred
  'primary_topic',     -- Main subject of story
  'mentioned',         -- Referenced in context
  'comparative'        -- Used for comparison/contrast
);

-- Add role field to junction table
ALTER TABLE story_entity_location
ADD COLUMN role location_role DEFAULT 'mentioned';
```

**Backfill Logic:**
```sql
-- Priority order for role assignment:
-- 1. If story has single rank=1 location → 'event_location'
-- 2. If multiple rank=1 locations + high confidence → 'primary_topic'
-- 3. Everything else → 'mentioned'

UPDATE story_entity_location sel
SET role = CASE
  WHEN (SELECT COUNT(*) FROM story_entity_location
        WHERE story_id = sel.story_id AND rank = 1) = 1
    THEN 'event_location'
  WHEN sel.confidence > 0.85 AND (SELECT COUNT(*) FROM story_entity_location
        WHERE story_id = sel.story_id AND rank = 1) > 1
    THEN 'primary_topic'
  ELSE 'mentioned'
END;
```

**Frontend Query After Implementation:**
```typescript
// Get stories where events HAPPENED in Iran
.from('story_entity_location')
.select('story_id')
.in('location_id', iranLocationIds)
.eq('role', 'event_location')  // Only actual event locations
```

**Benefits:**
- Solves the core semantic problem
- Enables "events in Iran" vs "stories about Iran" queries
- Future-proof for other semantic distinctions
- More accurate than rank-based filtering

#### Option 2: Populate story_entity_country Table (ALTERNATIVE)

**Current State:** `story_entity_country` table exists but is EMPTY (0 rows)

**Approach:** Populate with authoritative country relationships

```sql
INSERT INTO story_entity_country (story_id, country_id, rank, confidence)
SELECT
  sel.story_id,
  ec.id as country_id,
  sel.rank,
  sel.confidence
FROM story_entity_location sel
JOIN entity_location el ON sel.location_id = el.id
JOIN entity_country ec ON el.name ILIKE ec.name
  OR el.name = ANY(ec.aliases)
WHERE el.location_type IN ('Country', 'country');
```

**Benefits:**
- Enables robust country queries via ISO codes
- More authoritative than name-based matching
- Cleaner data model for country-level queries

**Limitations:**
- Doesn't solve semantic role problem
- Still returns overly broad results (20-30% false positives)
- Better used in combination with Option 1

#### Option 3: Enhance NLP Pipeline (LONG-TERM)

**Enhance entity extraction to detect semantic roles during ingestion:**

Detection Heuristics:

**For Event Location:**
- Prepositions: "in Tehran", "at the border", "from Iran"
- Proximity to action verbs: "killed in Iran", "protests in Tehran"
- Headline location mentions
- Single dominant location in dateline/byline

**For Primary Topic:**
- High mention frequency throughout article
- Presence in headline/subheadline
- Subject of main clauses
- Multiple related locations (cities within country)

**For Context Mention:**
- Lower mention frequency
- Comparative clauses: "unlike Iran"
- Listed among many countries
- Explanatory/background sections

**Implementation Pattern:**
```python
def classify_location_role(location, article_text, locations_mentioned):
    # Event location indicators
    if has_proximity_to_action_verbs(location, article_text):
        if is_single_dominant_location(location, locations_mentioned):
            return 'event_location'

    # Primary topic indicators
    if location in article.headline:
        if mention_frequency(location) > threshold:
            return 'primary_topic'

    # Default to mentioned
    return 'mentioned'
```

**Benefits:**
- Solves problem at source (data ingestion)
- Future stories automatically get correct classification
- More accurate than post-hoc adjustments

**Drawbacks:**
- High complexity (requires NLP expertise)
- Requires reprocessing existing stories
- Long implementation timeline (Quarter 1+)

---

## Database Schema Reference

### Key Tables

#### entity_location
Master table of all geographic entities

```
id (integer, PK)
name (text)
location_type (text) - "Country", "city", "Location", "Address", region, etc.
lat, lon (double precision)
is_preseeded (boolean)
```

**Row Count:** 8,916 locations
**Status:** ✓ Correct

#### entity_country
Canonical country reference

```
id (integer, PK)
name (text) - Official name (e.g., "Iran", "Islamic Republic of Iran")
iso_alpha2 (varchar) - 2-letter code (e.g., "IR")
iso_alpha3 (varchar) - 3-letter code (e.g., "IRN")
aliases (jsonb) - Alternative names (e.g., "Persia")
```

**Row Count:** 205 countries
**Status:** ✓ Correct

#### story_entity_location
Story ↔ Location junction table

```
story_id (uuid, FK)
location_id (integer, FK) → entity_location(id)
rank (integer) - Importance ranking in story
confidence (double precision) - Extraction confidence (0-1)
```

**Row Count:** 95,442 relationships
**Status:** ✓ Correct
**Note:** rank=1 means "context entity" (multiple allowed per story, by design)
**Stories with multiple rank=1:** 3,323 (37%)

#### story_entity_country
Story ↔ Country junction table (PLANNED)

```
story_id (uuid, FK)
country_id (integer, FK) → entity_country(id)
rank (integer)
confidence (double precision)
```

**Row Count:** 0 (EMPTY - needs population)
**Status:** ✗ Not populated
**Action Required:** Populate using entity_location → entity_country mapping

#### story
News story aggregate record

```
id (uuid, PK)
title (text)
summary (text)
description (text)
created (timestamp)
updated (timestamp)
keywords (jsonb)
```

**Status:** ✓ Correct structure
**Issue:** No UNIQUE constraint on title → allows duplicate stories
**Action Required:** Add uniqueness enforcement

#### news_item
Individual news items within stories

```
id (uuid, PK)
story_id (uuid, FK) → story(id)
title (text)
content (text)
source_id (integer)
published (timestamp)
```

**Status:** ✓ Correct structure

---

## Testing & Validation Queries

### Issue #1: Duplicate Stories

**Find all duplicate stories by title:**
```sql
SELECT title, COUNT(*) as story_count, array_agg(id) as story_ids
FROM story
GROUP BY title
HAVING COUNT(*) > 1
ORDER BY story_count DESC
LIMIT 50;
```

**Find stories with zero news items (orphans):**
```sql
SELECT s.id, s.title, COUNT(ni.id) as news_item_count
FROM story s
LEFT JOIN news_item ni ON ni.story_id = s.id
GROUP BY s.id, s.title
HAVING COUNT(ni.id) = 0;
```

**Count duplicate "#Iran" stories:**
```sql
SELECT title, COUNT(*) as story_count
FROM story
WHERE title = '#Iran '
GROUP BY title;
-- Expected: 14 stories
```

**Verify Persian President duplicates:**
```sql
SELECT title, COUNT(*) as story_count
FROM story
WHERE title LIKE 'Iranian President Pezeshkian:%'
GROUP BY title;
-- Expected: 5 stories
```

---

### Issue #2: False Positive Locations

**Locations matching '%Iran%' pattern:**
```sql
SELECT id, name, location_type
FROM entity_location
WHERE name ILIKE '%Iran%'
ORDER BY name;
-- Expected: 17 results (9 legitimate + 8 false positives)
```

**After fix - exact match with type filter:**
```sql
SELECT id, name, location_type
FROM entity_location
WHERE name ILIKE 'Iran'
  AND location_type IN ('Country', 'country')
ORDER BY name;
-- Expected: 1 result (only Iran)
```

**Find stories with false positive locations:**
```sql
SELECT DISTINCT s.id, s.title
FROM story s
JOIN story_entity_location sel ON s.id = sel.story_id
JOIN entity_location el ON sel.location_id = el.id
WHERE el.name IN ('Miranda', 'Miranda State', 'Tirana', 'Childiran', 'Guarapiranga dam', 'Antsiranana')
  AND sel.rank = 1
ORDER BY s.id;
-- Expected: 13 stories from non-Iran countries
```

---

### Issue #3: Country Semantic Roles

**Stories with multiple rank=1 locations:**
```sql
SELECT story_id, COUNT(*) as rank1_count, array_agg(el.name) as locations
FROM story_entity_location sel
JOIN entity_location el ON sel.location_id = el.id
WHERE sel.rank = 1
GROUP BY story_id
HAVING COUNT(*) > 1
ORDER BY rank1_count DESC
LIMIT 20;
-- Expected: 3,323 stories have multiple rank=1 locations
```

**Check for story_entity_country population:**
```sql
SELECT COUNT(*) as populated_count
FROM story_entity_country;
-- Expected: 0 (currently empty)
```

**Verify Iran stories after country table population:**
```sql
SELECT COUNT(DISTINCT sec.story_id) as story_count
FROM story_entity_country sec
JOIN entity_country ec ON sec.country_id = ec.id
WHERE ec.iso_alpha2 = 'IR'
  AND sec.rank = 1;
-- Expected: ~161 stories (once populated)
```

---

## Immediate Action Items

### Priority 1: CRITICAL (This Week)

#### 1.1: Fix Duplicate Story Creation Logic
- **Owner:** Backend Team
- **Effort:** 4-8 hours
- **Impact:** Prevents future duplicates

**Tasks:**
1. Review story creation code in ETL pipeline
2. Implement pre-creation check: SELECT story WHERE title = ? FOR UPDATE
3. Add application-level locking (distributed lock if multiple workers)
4. Use INSERT ... ON CONFLICT pattern for upsert safety
5. Add comprehensive logging for duplicate detection
6. Deploy with monitoring

**Code Review Points:**
- Transaction isolation level (use SERIALIZABLE or READ COMMITTED with locks)
- Race condition safety for concurrent workers
- Error handling for duplicate detection failures
- Logging for audit trail

#### 1.2: Clean Up Existing Duplicates
- **Owner:** Database Admin / Backend Team
- **Effort:** 3-4 hours
- **Impact:** Restores data quality immediately

**Tasks:**
1. Identify all duplicate title groups (see query above)
2. For each group:
   - Select earliest created story as canonical
   - Move all news items from other stories to canonical
   - Update foreign keys
   - Delete duplicate stories
3. Verify no orphans remain (stories with 0 news items)
4. Validate data integrity (primary keys, foreign keys)

**Affected Records:**
- 14 "#Iran" stories → consolidate to 1
- 5 "Iranian President Pezeshkian" stories → consolidate to 1
- 7 gold coin story variants → consolidate appropriately

### Priority 2: HIGH (This Week - Friday)

#### 2.1: Implement Country Filtering Fix
- **Owner:** Frontend Team
- **Effort:** 1 hour
- **Impact:** Eliminates 7.5% false positives immediately

**Change:** `/app/api/stories/country/[country]/route.ts` lines 26-30
- Remove: `.ilike('name', \`%${country}%\`)`
- Add: `.ilike('name', country)` + `.in('location_type', ['Country', 'country'])`
- Test: Verify Iran query returns 161 legitimate stories, 0 false positives

#### 2.2: Add Story Deduplication Monitoring
- **Owner:** Backend Team
- **Effort:** 2-3 hours
- **Impact:** Early warning system for future duplicates

**Tasks:**
1. Add database trigger or daily job to detect new duplicates
2. Alert if story with same title created within 24 hours
3. Log all duplicate detection events
4. Create weekly report of potential duplicates

### Priority 3: MEDIUM (Next Two Weeks)

#### 3.1: Populate story_entity_country Table
- **Owner:** ETL Team
- **Effort:** 4-6 hours
- **Impact:** Enables robust country-level queries

**Tasks:**
1. Review entity_country table structure (205 countries)
2. Write migration to populate story_entity_country
3. Use mapping: story_entity_location → entity_location → entity_country
4. Handle alias matching for alternative country names
5. Validate population results (coverage, accuracy)
6. Create indices: `story_entity_country(country_id, rank)`

**Expected Results:**
- ~9,000 stories linked to countries
- ~200 countries represented
- Enables ISO code-based queries

#### 3.2: Normalize location_type Values
- **Owner:** ETL Team
- **Effort:** 2-3 hours
- **Impact:** Data consistency for location queries

**Tasks:**
1. Audit current location_type values
2. Standardize to: Country, City, Region, Address, Landmark, etc.
3. Update existing records
4. Create enum constraint for data validation
5. Update entity extraction pipeline to use standard values

### Priority 4: LONG-TERM (Quarter 1+)

#### 4.1: Implement Semantic Role Field
- **Owner:** Backend + NLP Team
- **Effort:** 20-40 hours
- **Impact:** Solves 20-30% country filter false positives

**Tasks:**
1. Create location_role enum type
2. Add role column to story_entity_location
3. Implement backfill logic based on heuristics
4. Enhance NLP pipeline to classify roles on ingestion
5. Update API queries to filter by role
6. Validate improvements with test dataset

**Success Criteria:**
- "Event in Iran" queries return only events happening in Iran
- "Stories about Iran" queries available as separate filter
- <5% false positive rate (down from 20-30%)

#### 4.2: Add Hierarchical Location Support
- **Owner:** ETL Team
- **Effort:** 10-15 hours
- **Impact:** Better location query precision

**Tasks:**
1. Add country_id foreign key to entity_location
2. Map all cities/regions to parent countries
3. Create location hierarchy indices
4. Enable hierarchical queries (e.g., "All stories in Iran → Tehran → specific district")
5. Update entity extraction to use hierarchy

---

## Contact & Resources

### Backend Team Documentation
- **Database Schema:** Review schema reference above
- **Query Performance:** entity_location queries should use indices on (name, location_type)
- **ETL Pipeline:** Check story creation logic for duplicate prevention

### Investigation Source Files
- **Duplicate Stories Analysis:** Original investigation identified 14+ duplicate story groups
- **Country Filtering Analysis:** Identified 13 false positive stories from substring matching
- **Semantic Role Analysis:** Documented 3,323 stories with multiple rank=1 locations

### Key Stakeholders
- **Backend/ETL Team:** Primary responsibility for Issues #1 and #3
- **Frontend Team:** Implement Issue #2 fix (country filtering)
- **Database Admin:** Assist with cleanup queries and indices

### Questions?
- Review specific issue sections above for detailed evidence and examples
- Check testing queries section for validation commands
- Consult database schema reference for table structures

---

## Appendix: Summary of Changes Required

| Issue | Component | Change Type | Effort | Priority |
|-------|-----------|------------|--------|----------|
| Duplicate Stories | Story Creation Logic | Code Change | 8h | P1 |
| Duplicate Stories | Database Cleanup | Data Migration | 4h | P1 |
| False Positives | Location Query | Code Change | 1h | P2 |
| Deduplication Monitoring | Validation Job | Code Change | 3h | P2 |
| Country Queries | story_entity_country | Data Population | 6h | P3 |
| Semantic Roles | Entity Extraction | Code Change | 30h | P4 |
| Location Hierarchy | Database Schema | DDL + Backfill | 15h | P4 |

**Total Effort (All Items):** ~67 hours
**Recommended Phase 1 (P1+P2):** ~17 hours, 1 week
**Recommended Phase 2 (P3):** ~6 hours, Week 2-3
**Recommended Phase 3 (P4):** ~45 hours, Quarter 1
