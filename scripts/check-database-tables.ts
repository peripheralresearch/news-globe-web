#!/usr/bin/env tsx

import { supabaseServer } from '../lib/supabase/server';

async function checkTables() {
  const supabase = supabaseServer();

  console.log('=== Checking Database Tables ===\n');

  // Try querying known tables
  const knownTables = [
    'posts',
    'messages',
    'media',
    'locations_master',
    'people_master',
    'policies_master',
    'groups_master',
    'post_locations',
    'post_people',
    'post_policies',
    'post_groups',
    'articles',
    'rss_feeds',
    'news_articles',
    'feeds',
  ];

  console.log('Checking known table names:\n');

  for (const tableName of knownTables) {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (!error) {
      console.log(`✓ ${tableName}: ${count} rows`);
    } else {
      // Table doesn't exist or we don't have access
      console.log(`✗ ${tableName}: not found/no access`);
    }
  }
}

checkTables().catch(console.error);
