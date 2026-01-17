#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvFromDotenvLikeFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    let value = line.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}

function getArgValue(args, name, fallback) {
  const idx = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (idx === -1) return fallback;
  const arg = args[idx];
  if (arg.includes('=')) return arg.split('=').slice(1).join('=');
  return args[idx + 1] ?? fallback;
}

function hasFlag(args, name) {
  return args.includes(`--${name}`);
}

function formatIso(iso) {
  try {
    return new Date(iso).toISOString().replace('T', ' ').replace('Z', 'Z');
  } catch {
    return iso;
  }
}

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'while',
  'of', 'to', 'in', 'on', 'for', 'with', 'as', 'at', 'by', 'from', 'into', 'over',
  'about', 'after', 'before', 'between', 'during', 'through', 'under', 'within',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do',
  'does', 'did', 'will', 'would', 'can', 'could', 'may', 'might', 'must', 'should',
  'not', 'no', 'nor', 'so', 'too', 'very', 'than', 'that', 'this', 'these', 'those',
  'it', 'its', 'they', 'them', 'their', 'he', 'him', 'his', 'she', 'her', 'we', 'us',
  'you', 'your', 'i', 'me', 'my', 'our', 'ours', 'yours', 'also',
]);

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(/\s+/g)
    .map(t => t.trim())
    .filter(t => t.length >= 3 && !STOPWORDS.has(t));
}

function buildTf(tokens) {
  const counts = new Map();
  for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);
  return { counts, total: tokens.length };
}

function buildIdf(docsTokens) {
  const df = new Map();
  for (const tokens of docsTokens) {
    const seen = new Set(tokens);
    for (const t of seen) df.set(t, (df.get(t) || 0) + 1);
  }
  const n = docsTokens.length;
  const idf = new Map();
  for (const [t, d] of df.entries()) {
    idf.set(t, Math.log((n + 1) / (d + 1)) + 1);
  }
  return idf;
}

function buildTfidfVector(tokens, idf) {
  const { counts, total } = buildTf(tokens);
  const vec = new Map();
  if (!total) return { vec, norm: 0 };
  let sumSq = 0;
  for (const [t, c] of counts.entries()) {
    const w = (c / total) * (idf.get(t) || 0);
    if (w === 0) continue;
    vec.set(t, w);
    sumSq += w * w;
  }
  return { vec, norm: Math.sqrt(sumSq) };
}

function cosine(a, b) {
  if (!a.norm || !b.norm) return 0;
  let dot = 0;
  const [small, large] = a.vec.size <= b.vec.size ? [a.vec, b.vec] : [b.vec, a.vec];
  for (const [t, w] of small.entries()) {
    const w2 = large.get(t);
    if (w2) dot += w * w2;
  }
  return dot / (a.norm * b.norm);
}

function mean(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function percentile(nums, p) {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[idx];
}

function samplePairs(n, maxPairs) {
  const pairs = [];
  if (n < 2) return pairs;
  const totalPairs = (n * (n - 1)) / 2;
  const target = Math.min(maxPairs, totalPairs);
  if (target === totalPairs) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) pairs.push([i, j]);
    }
    return pairs;
  }
  const seen = new Set();
  while (pairs.length < target) {
    const i = Math.floor(Math.random() * n);
    let j = Math.floor(Math.random() * n);
    if (i === j) continue;
    const a = Math.min(i, j);
    const b = Math.max(i, j);
    const key = `${a}:${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push([a, b]);
  }
  return pairs;
}

async function main() {
  const args = process.argv.slice(2);
  const hours = Number(getArgValue(args, 'hours', '48'));
  const limit = Number(getArgValue(args, 'limit', '10'));
  const maxStories = Number(getArgValue(args, 'max-stories', '200'));
  const minNewsItems = Number(getArgValue(args, 'min-news-items', '2'));
  const outlierThreshold = Number(getArgValue(args, 'outlier-threshold', '0.08'));
  const includeContent = hasFlag(args, 'include-content');
  const jsonPath = getArgValue(args, 'json', '');

  loadEnvFromDotenvLikeFile(path.join(process.cwd(), '.env.local'));
  loadEnvFromDotenvLikeFile(path.join(process.cwd(), '.env'));

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars. Set SUPABASE_URL and SUPABASE_ANON_KEY (or NEXT_PUBLIC_ equivalents).');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const newsSelect = includeContent
    ? 'id,title,content,published,link,media_url,media_type'
    : 'id,title,published,link';

  const { data: stories, error: storiesError } = await supabase
    .from('story')
    .select(
      `
      id,
      title,
      description,
      summary,
      created,
      updated,
      topic_keywords,
      news_item!inner(${newsSelect})
    `
    )
    .gte('created', timeThreshold)
    .order('created', { ascending: false })
    .limit(maxStories);

  if (storiesError) {
    console.error('Failed to fetch stories:', storiesError);
    process.exit(1);
  }

  if (!stories || stories.length === 0) {
    console.log('No stories found in the requested time window.');
    return;
  }

  const storyIds = stories.map(s => s.id);

  const [locationsResult, peopleResult, organisationsResult] = await Promise.all([
    supabase.from('story_entity_location').select('story_id').in('story_id', storyIds),
    supabase.from('story_entity_person').select('story_id').in('story_id', storyIds),
    supabase.from('story_entity_organisation').select('story_id').in('story_id', storyIds),
  ]);

  const entityCountByStory = new Map();
  for (const r of [locationsResult, peopleResult, organisationsResult]) {
    if (r.error) continue;
    for (const row of r.data || []) {
      entityCountByStory.set(row.story_id, (entityCountByStory.get(row.story_id) || 0) + 1);
    }
  }

  const scoredStories = stories
    .map(story => {
      const newsItems = Array.isArray(story.news_item)
        ? story.news_item
        : [story.news_item].filter(Boolean);
      const newsItemCount = newsItems.length;
      const entityCount = entityCountByStory.get(story.id) || 0;

      const hoursSinceCreation = (Date.now() - new Date(story.created).getTime()) / (1000 * 60 * 60);
      const recencyBonus = hoursSinceCreation < 12 ? 5 : hoursSinceCreation < 24 ? 2 : 0;
      const trendingScore = newsItemCount * 2 + entityCount + recencyBonus;

      return {
        ...story,
        newsItems,
        newsItemCount,
        entityCount,
        trendingScore,
      };
    })
    .filter(s => s.newsItemCount >= minNewsItems)
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, limit);

  if (scoredStories.length === 0) {
    console.log('No stories met the minimum news item threshold.');
    return;
  }

  // Build TF-IDF IDF over all story texts + news item texts in the evaluation slice.
  const allDocsTokens = [];
  const storyDocTokens = new Map();
  const newsDocTokens = new Map(); // key: `${storyId}:${newsId}`

  for (const story of scoredStories) {
    const storyText = [
      story.title,
      story.description,
      story.summary,
      Array.isArray(story.topic_keywords) ? story.topic_keywords.join(' ') : '',
    ]
      .filter(Boolean)
      .join(' ');

    const sTokens = tokenize(storyText);
    storyDocTokens.set(story.id, sTokens);
    allDocsTokens.push(sTokens);

    for (const item of story.newsItems) {
      const itemText = includeContent
        ? [item.title, (item.content || '').slice(0, 800)].filter(Boolean).join(' ')
        : String(item.title || '');
      const nTokens = tokenize(itemText);
      const key = `${story.id}:${item.id}`;
      newsDocTokens.set(key, nTokens);
      allDocsTokens.push(nTokens);
    }
  }

  const idf = buildIdf(allDocsTokens);
  const storyVecs = new Map();
  const newsVecs = new Map();

  for (const story of scoredStories) {
    storyVecs.set(story.id, buildTfidfVector(storyDocTokens.get(story.id) || [], idf));
    for (const item of story.newsItems) {
      const key = `${story.id}:${item.id}`;
      newsVecs.set(key, buildTfidfVector(newsDocTokens.get(key) || [], idf));
    }
  }

  const evaluated = scoredStories.map(story => {
    const sVec = storyVecs.get(story.id);
    const simsToStory = story.newsItems.map(item => {
      const nVec = newsVecs.get(`${story.id}:${item.id}`);
      return cosine(sVec, nVec);
    });

    const pairIdx = samplePairs(story.newsItems.length, 200);
    const pairSims = pairIdx.map(([i, j]) => {
      const a = newsVecs.get(`${story.id}:${story.newsItems[i].id}`);
      const b = newsVecs.get(`${story.id}:${story.newsItems[j].id}`);
      return cosine(a, b);
    });

    const avgToStorySim = mean(simsToStory);
    const avgPairwiseSim = mean(pairSims);
    const p25ToStory = percentile(simsToStory, 0.25);
    const minToStory = Math.min(...simsToStory, 1);

    const outliers = story.newsItems
      .map((item, idx) => ({ item, sim: simsToStory[idx] }))
      .filter(x => x.sim < outlierThreshold)
      .sort((a, b) => a.sim - b.sim)
      .slice(0, 10);

    const cohesionScore = avgToStorySim * 0.6 + avgPairwiseSim * 0.4;

    return {
      story,
      metrics: {
        avgToStorySim,
        avgPairwiseSim,
        p25ToStory,
        minToStory,
        outlierCount: outliers.length,
        cohesionScore,
      },
      outliers,
      simsToStory,
    };
  });

  const overall = {
    storiesEvaluated: evaluated.length,
    hours,
    limit,
    outlierThreshold,
    avgCohesion: mean(evaluated.map(e => e.metrics.cohesionScore)),
    avgAvgToStory: mean(evaluated.map(e => e.metrics.avgToStorySim)),
    avgAvgPairwise: mean(evaluated.map(e => e.metrics.avgPairwiseSim)),
    storiesWithOutliers: evaluated.filter(e => e.metrics.outlierCount > 0).length,
  };

  const sortedWorst = [...evaluated].sort((a, b) => a.metrics.cohesionScore - b.metrics.cohesionScore);
  const sortedBest = [...evaluated].sort((a, b) => b.metrics.cohesionScore - a.metrics.cohesionScore);

  console.log('=== Story Clustering Semantic Check (TF-IDF proxy) ===');
  console.log(`Window: last ${hours}h | Top stories: ${evaluated.length} (ranked by trending score)`);
  console.log(
    `Cohesion (higher=better): avg=${overall.avgCohesion.toFixed(3)} | toStory avg=${overall.avgAvgToStory.toFixed(
      3
    )} | pairwise avg=${overall.avgAvgPairwise.toFixed(3)}`
  );
  console.log(
    `Outliers (toStory < ${outlierThreshold}): ${overall.storiesWithOutliers}/${overall.storiesEvaluated} stories had >=1 outlier`
  );
  console.log('');

  function printStory(e, idx, label) {
    const s = e.story;
    const m = e.metrics;
    console.log(`${label} #${idx + 1}: ${s.title}`);
    console.log(
      `  story_id=${s.id} | created=${formatIso(s.created)} | items=${s.newsItemCount} | entities=${s.entityCount} | trending=${s.trendingScore}`
    );
    console.log(
      `  cohesion=${m.cohesionScore.toFixed(3)} | toStory(avg/p25/min)=${m.avgToStorySim.toFixed(3)}/${m.p25ToStory.toFixed(
        3
      )}/${m.minToStory.toFixed(3)} | pairwise=${m.avgPairwiseSim.toFixed(3)} | outliers=${m.outlierCount}`
    );

    for (let i = 0; i < Math.min(s.newsItems.length, 12); i++) {
      const item = s.newsItems[i];
      const sim = e.simsToStory[i];
      const prefix = sim < outlierThreshold ? 'OUTLIER' : '       ';
      const title = (item.title || '').replace(/\s+/g, ' ').trim();
      console.log(
        `  ${prefix} (${sim.toFixed(3)}) news_id=${item.id} ${title || '[no title]'}${item.link ? ` — ${item.link}` : ''}`
      );
    }
    if (s.newsItems.length > 12) console.log(`  ... (${s.newsItems.length - 12} more)`);
    console.log('');
  }

  console.log('--- Worst (lowest cohesion) ---');
  sortedWorst.slice(0, Math.min(5, sortedWorst.length)).forEach((e, i) => printStory(e, i, 'WORST'));

  console.log('--- Best (highest cohesion) ---');
  sortedBest.slice(0, Math.min(5, sortedBest.length)).forEach((e, i) => printStory(e, i, 'BEST'));

  if (jsonPath) {
    const payload = {
      generatedAt: new Date().toISOString(),
      config: { hours, limit, maxStories, minNewsItems, outlierThreshold, includeContent },
      overall,
      evaluated: evaluated.map(e => ({
        story: {
          id: e.story.id,
          title: e.story.title,
          created: e.story.created,
          updated: e.story.updated,
          topic_keywords: e.story.topic_keywords,
          newsItemCount: e.story.newsItemCount,
          entityCount: e.story.entityCount,
          trendingScore: e.story.trendingScore,
          newsItems: e.story.newsItems.map((ni, idx) => ({
            id: ni.id,
            title: ni.title,
            published: ni.published,
            link: ni.link,
            simToStory: e.simsToStory[idx],
          })),
        },
        metrics: e.metrics,
      })),
    };
    fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2));
    console.log(`Wrote JSON report to ${jsonPath}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
