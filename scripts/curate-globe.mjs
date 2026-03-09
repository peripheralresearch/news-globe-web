#!/usr/bin/env node

/**
 * Globe Curation Script
 *
 * Agentic workflow that pulls recent news from Supabase, sends to Claude
 * for editorial curation, and writes results to the globe_curated table.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ANTHROPIC_API_KEY=... node scripts/curate-globe.mjs
 *
 * Designed to run as a GitHub Action cron job every 15-30 minutes.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const FOCUS = process.env.FOCUS || 'middle_east_conflict';
const HOURS_BACK = parseInt(process.env.HOURS_BACK || '6', 10);
const DRY_RUN = process.env.DRY_RUN === 'true';

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_API_KEY) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Supabase REST helpers (no SDK dependency — just fetch)
// ---------------------------------------------------------------------------

async function supabaseQuery(table, { select = '*', filters = '', order = '', limit = 0 } = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  if (filters) url += `&${filters}`;
  if (order) url += `&order=${order}`;
  if (limit) url += `&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase query failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function supabaseRpc(fn, params = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase RPC ${fn} failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function supabaseUpsert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase upsert failed (${res.status}): ${body}`);
  }
  return res.json();
}

async function supabaseDelete(table, filters) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filters}`, {
    method: 'DELETE',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase delete failed (${res.status}): ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Claude API helper
// ---------------------------------------------------------------------------

async function askClaude(systemPrompt, userMessage) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude API failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  return data.content[0].text;
}

// ---------------------------------------------------------------------------
// Step 1: Pull recent news items with Middle East locations
// ---------------------------------------------------------------------------

async function fetchCandidateItems() {
  const since = new Date(Date.now() - HOURS_BACK * 3600 * 1000).toISOString();

  // Get news items that have locations in Middle East countries
  // Broad net — we let the AI decide what's actually conflict-relevant
  const items = await supabaseQuery('news_item', {
    select: [
      'id', 'title', 'content', 'published', 'media_url', 'media_type',
      'osint_source:osint_source_id(name,url)',
      'news_item_entity_location!inner(location_id,role,entity_location:location_id(id,name,lat,lon,country_code,location_type))',
    ].join(','),
    filters: [
      `published=gte.${since}`,
      'news_item_entity_location.entity_location.country_code=in.(IL,PS,LB,SY,IR,IQ,YE,JO,EG,SA,QA,BH,KW,AE,OM,TR)',
    ].join('&'),
    order: 'published.desc',
    limit: 300,
  });

  console.log(`Fetched ${items.length} candidate items from last ${HOURS_BACK} hours`);
  return items;
}

// ---------------------------------------------------------------------------
// Step 2: Deduplicate by title similarity
// ---------------------------------------------------------------------------

function deduplicateItems(items) {
  const seen = new Map();

  for (const item of items) {
    // Normalize title for dedup
    const key = (item.title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);

    if (!key || seen.has(key)) continue;
    seen.set(key, item);
  }

  const unique = [...seen.values()];
  console.log(`Deduplicated: ${items.length} -> ${unique.length} unique items`);
  return unique;
}

// ---------------------------------------------------------------------------
// Step 3: Send to Claude for curation
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an intelligence analyst curating a focused view of the Middle East conflict for a real-time globe visualization.

Your job is to select and rank news items that are DIRECTLY relevant to the ongoing Middle East conflict — including but not limited to:
- Military operations, strikes, and escalations (Israel, Iran, Gaza, Lebanon, Yemen, Syria)
- Diplomatic developments, negotiations, and ceasefire efforts
- Humanitarian impact and civilian casualties
- Geopolitical responses (US, Russia, China, EU involvement)
- Economic consequences (oil, shipping, sanctions, Hormuz strait)
- Proxy conflicts and regional spillover

EXCLUDE items that merely mention a Middle East location but are NOT about the conflict (e.g., sports, entertainment, domestic politics unrelated to the war, business deals, tourism).

For each selected item, provide:
1. relevance_score: 0.0-1.0 (how central to the conflict)
2. narrative_thread: one of ["military_escalation", "diplomacy", "humanitarian", "geopolitical", "economic_impact", "proxy_conflict", "domestic_politics", "information_warfare"]
3. significance: one of ["breaking", "developing", "context"]
4. ai_summary: 1-2 sentence summary focused on what happened and why it matters

Respond with ONLY a JSON array. Each element:
{"item_index": <number>, "relevance_score": <float>, "narrative_thread": "<string>", "significance": "<string>", "ai_summary": "<string>"}

Select the top items (aim for 20-40). Omit irrelevant items entirely.`;

async function curateWithAI(items) {
  // Prepare items for the AI — send title + truncated content
  const itemSummaries = items.map((item, i) => {
    const source = item.osint_source?.name || 'Unknown';
    const content = (item.content || '').slice(0, 300);
    const locations = (item.news_item_entity_location || [])
      .map(l => l.entity_location?.name)
      .filter(Boolean)
      .join(', ');

    return `[${i}] ${item.title || '(no title)'}\nSource: ${source} | Locations: ${locations} | Published: ${item.published}\n${content}\n`;
  });

  // Batch into chunks if needed (keep under ~100K tokens)
  const BATCH_SIZE = 80;
  const allResults = [];

  for (let start = 0; start < itemSummaries.length; start += BATCH_SIZE) {
    const batch = itemSummaries.slice(start, start + BATCH_SIZE);
    const batchLabel = `batch ${Math.floor(start / BATCH_SIZE) + 1}/${Math.ceil(itemSummaries.length / BATCH_SIZE)}`;

    console.log(`Sending ${batch.length} items to Claude (${batchLabel})...`);

    const userMessage = `Here are ${batch.length} recent news items. Select those relevant to the Middle East conflict:\n\n${batch.join('\n---\n')}`;

    const response = await askClaude(SYSTEM_PROMPT, userMessage);

    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error(`Failed to parse Claude response for ${batchLabel}:`, e.message);
      console.error('Response:', response.slice(0, 500));
      continue;
    }

    // Adjust indices for batches after the first
    for (const result of parsed) {
      result.item_index += start;
    }

    allResults.push(...parsed);
    console.log(`Claude selected ${parsed.length} relevant items from ${batchLabel}`);
  }

  return allResults;
}

// ---------------------------------------------------------------------------
// Step 4: Build rows and upsert to globe_curated
// ---------------------------------------------------------------------------

function buildCuratedRows(items, aiResults) {
  const rows = [];

  for (const result of aiResults) {
    const item = items[result.item_index];
    if (!item) {
      console.warn(`AI referenced item_index ${result.item_index} but it doesn't exist`);
      continue;
    }

    // Pick the best location (prefer event_location role, then first with coords)
    const locations = (item.news_item_entity_location || [])
      .map(l => ({ ...l.entity_location, role: l.role }))
      .filter(l => l && l.lat && l.lon);

    const eventLoc = locations.find(l => l.role === 'event_location') || locations[0];
    if (!eventLoc) continue;

    const source = item.osint_source || {};

    rows.push({
      focus: FOCUS,
      news_item_id: item.id,
      location_name: eventLoc.name,
      location_id: eventLoc.id,
      lat: eventLoc.lat,
      lon: eventLoc.lon,
      country_code: eventLoc.country_code,
      title: (item.title || '').slice(0, 300),
      content: (item.content || '').slice(0, 1000),
      published: item.published,
      source_name: source.name || 'Unknown',
      source_url: source.url || null,
      media_url: item.media_url || null,
      media_type: item.media_type || null,
      ai_summary: result.ai_summary,
      narrative_thread: result.narrative_thread,
      relevance_score: Math.max(0, Math.min(1, result.relevance_score)),
      significance: result.significance,
      curated_at: new Date().toISOString(),
      // Expire after 24 hours — next run will refresh
      expires_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Step 5: Cleanup expired items
// ---------------------------------------------------------------------------

async function cleanupExpired() {
  const now = new Date().toISOString();
  await supabaseDelete('globe_curated', `expires_at=lt.${now}&focus=eq.${FOCUS}`);
  console.log('Cleaned up expired curated items');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\n=== Globe Curation: ${FOCUS} ===`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Looking back: ${HOURS_BACK} hours`);
  console.log(`Dry run: ${DRY_RUN}\n`);

  // 1. Fetch candidates
  const rawItems = await fetchCandidateItems();
  if (rawItems.length === 0) {
    console.log('No candidate items found. Exiting.');
    return;
  }

  // 2. Deduplicate
  const items = deduplicateItems(rawItems);
  if (items.length === 0) {
    console.log('No items after dedup. Exiting.');
    return;
  }

  // 3. AI curation
  const aiResults = await curateWithAI(items);
  console.log(`\nAI selected ${aiResults.length} items total`);

  if (aiResults.length === 0) {
    console.log('AI found no relevant items. Exiting.');
    return;
  }

  // 4. Build rows
  const rows = buildCuratedRows(items, aiResults);
  console.log(`Built ${rows.length} curated rows`);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN: Would upsert these rows ---');
    for (const row of rows.slice(0, 5)) {
      console.log(`  [${row.significance}] ${row.title?.slice(0, 80)} (${row.narrative_thread}, ${row.relevance_score})`);
      console.log(`    ${row.ai_summary}`);
      console.log(`    Location: ${row.location_name} (${row.lat}, ${row.lon})`);
    }
    if (rows.length > 5) console.log(`  ... and ${rows.length - 5} more`);
    return;
  }

  // 5. Upsert to Supabase
  // Batch upserts to avoid hitting request size limits
  const UPSERT_BATCH = 50;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += UPSERT_BATCH) {
    const batch = rows.slice(i, i + UPSERT_BATCH);
    await supabaseUpsert('globe_curated', batch);
    upserted += batch.length;
    console.log(`Upserted ${upserted}/${rows.length} rows`);
  }

  // 6. Cleanup expired
  await cleanupExpired();

  console.log(`\nDone. ${rows.length} curated items written to globe_curated.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
