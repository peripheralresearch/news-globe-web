# Story Clustering: Using 5W1H Event Frames (Reasoning)

## Context

Today, story clustering appears to rely on:
- **Entity extraction** (GLINER): `Location`, `Person`, `Organisation` (and ranks/confidence).
- **Embeddings** (including incremental embeddings) to keep clusters updated as events evolve.

We also already know a core failure mode from `KNOWN_ISSUES_COUNTRY_FILTERING.md`:
> The system finds *which* countries/locations are mentioned, but not *why* (event location vs topic mention vs comparative reference).

That same limitation shows up in clustering: entities/embeddings can produce **topic buckets** instead of **event clusters**.

## What I observed (and why it matters)

I ran a lightweight audit that checks whether news items inside a `story` are semantically cohesive. It’s a proxy (TF‑IDF cosine similarity across story text + news titles/content), but it’s useful for spotting drift/outliers quickly.

Tooling added:
- `scripts/evaluate-story-clustering.js` (fetches “top/trending” stories + their `news_item`s and scores within-story cohesion; flags outliers)

Example run:
```bash
node scripts/evaluate-story-clustering.js --hours 48 --limit 50 --include-content
```

In the last 48h trending sample I pulled (21 stories with ≥2 news items), **6/21 clusters contained at least one strong outlier** (very low similarity to the rest of the story).

### Concrete examples of “too broad” / drift

#### 1) Country + shared theme, but different event locations

This cluster is “Indonesia floods / response”, but spans **Aceh vs Sumatra vs Java**, which suggests it’s clustering by *theme + country*, not one event:

- `story_id=ec36439e-9be2-4562-abd8-9696268ddac6` “Indonesia's KSP delivers emergency aid to flood-hit Aceh”
  - `news_id=554dfaea-7578-4efc-ab69-56ec6b2290c9` Indonesia's KSP delivers emergency aid to flood-hit Aceh
  - `news_id=5a8674f1-f6b6-4fc1-aa1d-cd5e6c20bc74` Indonesia plans three-year recovery after deadly Sumatra floods
  - `news_id=4677e7a6-8f2f-4e11-a84a-3f786fe1aad9` President Prabowo orders BNPB to step up flood response in Java

This is the classic “topic bucket” behavior. Depending on product intent, this might be undesirable:
- If stories should represent **one evolving incident**, this should likely be split by `where`.
- If stories are meant to represent **a rolling theme** (“Indonesia flood response”), it’s acceptable but the title should reflect that umbrella.

#### 2) Same country pair in context, different “what”

This looks like a merge driven by overlapping entities/countries (“Canada”, “China”), but the *event/action* differs:

- `story_id=0f28a0ee-0b7f-40d5-a7a0-ba35c7aed003` “Canadian journalists carrying 'burner phones' in China…”
  - `news_id=18611be5-a621-4e0b-b925-56db4a15dc20` “...burner phones...”
  - `news_id=c52ccf3e-2d3a-45d2-be4a-8b213d907da8` “Canada agrees to cut tariff on Chinese EVs…”

Both mention Canada/China, but the “what” is different (journalist OPSEC vs trade/tariffs).

#### 3) Region bucket vs country-specific event

Central Asia items get clustered together despite being different countries/topics:

- `story_id=9f7d0685-0042-4607-a75e-0ce7e287bd58` “World Bank spotlights Tajikistan…”
  - `news_id=0d45144e-4b72-405e-aabb-5f9e320d8afc` “Tajikistan’s economic outlook…”
  - `news_id=0267fafd-1e6c-4bbe-b172-912756e467a1` “Turkmenistan… cashless transactions…”

This is “same region” or “same outlet style”, not one event.

## Why entities + embeddings tend to go broad

### 1) Entities don’t encode semantic role
From the country-filtering issue: a country/location can be:
- where the event occurred (**event_location**),
- what the story is mainly about (**primary_topic**),
- a throwaway mention (**mentioned/comparative**).

If all of these get treated similarly in clustering, you get umbrella clusters and wrong merges.

### 2) Embeddings optimize for “aboutness”, not “event identity”
Embeddings are great at grouping by high-level meaning, but they often merge:
- commentary/analysis with incident reporting,
- multiple sub-events within a broader crisis,
- “same theme, different incident” content.

### 3) Ongoing events create legitimate drift
Incremental clustering can drift as new articles arrive:
- the cluster centroid broadens,
- entities accumulate,
- time span increases,
- and eventually it becomes a “topic container”.

That drift isn’t necessarily bad, but you need explicit controls if you want event-level stories.

## How 5W1H helps (and how I’d use it)

If you already extract **5W1H** (who/what/when/where/why/how), you can treat it as a structured “event frame”.

Key idea:
- Use embeddings for semantics,
- Use 5W1H for **event identity constraints** and **role disambiguation**.

### Recommended architecture: two-stage clustering

#### Stage A: Candidate generation / blocking (hard-ish filters)
Only compare a new `news_item` against a small set of plausible clusters, using:
- **when**: within a time window (configurable by domain)
- **where**: same canonical location (hierarchical: city → admin region → country)
- optional: **who** overlap if present (high precision when available)

This alone prevents many “Canada+China → merge” style errors.

#### Stage B: Scoring / assignment (soft combination)
Compute a combined score such as:
```
score = w_embed * embedSim
      + w_where * whereSim
      + w_when  * timeSim
      + w_what  * whatSim
      + w_who   * whoOverlap
      + w_ent   * entityOverlap
```

Practical notes:
- Weight by extraction confidence (`5W1H_confidence`, entity confidence).
- Use asymmetric penalties (e.g., strong penalty if `where` conflicts and `where_confidence` is high).
- Prefer “no-merge” when constraints conflict (better to split than pollute).

### Use 5W1H to fix the semantic-role problem
If your 5W1H extractor can output “where the event happened” vs “locations mentioned”, you can:
- Populate a `role` field (like the one proposed in `KNOWN_ISSUES_COUNTRY_FILTERING.md`).
- Distinguish `event_location` from `mentioned` and prevent merges driven by mentions.

## Data model suggestion (minimal additions)

At minimum, store per-news-item event frame fields (even if as JSON initially):
- `news_item.event_where[]` (canonical location IDs + role + confidence)
- `news_item.event_when` (timestamp or range + confidence)
- `news_item.event_who[]` (person/org IDs + role/confidence)
- `news_item.event_what` (short normalized action string + confidence)
- optional: `event_why`, `event_how` (mostly useful for summarization, less for clustering)

Then derive story-level aggregates:
- dominant event location(s),
- time span,
- top actors,
- stable “what” signature.

## Handling ongoing events without drifting broad

If you want event-level stories that still evolve:
- Maintain per-cluster distributions for `where`, `what`, `who`.
- Compute drift indicators:
  - location entropy (too many distinct event locations),
  - “what” entropy (too many different action types),
  - time span growth (cluster covers too long).
- When drift crosses thresholds: **split** or “close” the cluster (create a new story).

If you *do* want thematic stories:
- Keep the umbrella, but label it as such (title and UI) and/or add subclusters.

## Measuring clustering quality (simple, actionable metrics)

Even without perfect ground truth, you can monitor:
- **Outlier rate**: percent of clusters with ≥1 low-similarity news item.
- **Within-cluster cohesion**: average pairwise similarity.
- **Location entropy**: number/diversity of event locations marked `event_location`.
- **Time span**: cluster duration.
- **Actor diversity**: number of distinct `who` entities.

The audit script is a starting point; the real win is adding “event frame” metrics once 5W1H is persisted.

## Bottom line

Clustering purely on entities + embeddings will keep producing “broad topic buckets” unless you add:
- **semantic roles** (event location vs mention),
- **event-identity constraints** (where/when/what/who),
- and **drift controls** (split/close rules).

5W1H outputs are a good fit for this: they turn “aboutness” into “this happened here/then, involving these actors, with this action”.

