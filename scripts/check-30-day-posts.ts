#!/usr/bin/env tsx

import { supabaseServer } from '../lib/supabase/server';

async function check30DayPosts() {
  const supabase = supabaseServer();

  // Calculate 30 days ago
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  console.log(`Checking posts from last 30 days (since ${thirtyDaysAgo})...\n`);

  // Count total posts in 30 days
  const { count, error } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .gte('date', thirtyDaysAgo);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total posts in last 30 days: ${count}`);

  // Fetch first 3000 to analyze distribution
  const { data: posts, error: fetchError } = await supabase
    .from('posts')
    .select('date')
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: false })
    .range(0, 2999);

  if (fetchError) {
    console.error('Fetch error:', fetchError);
    return;
  }

  console.log(`\nFetched ${posts?.length || 0} posts for analysis`);

  // Group by day
  const byDay: Record<string, number> = {};
  posts?.forEach(p => {
    const day = p.date.split('T')[0];
    byDay[day] = (byDay[day] || 0) + 1;
  });

  console.log('\nPosts by day (last 30 days):');
  Object.entries(byDay)
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([day, count]) => {
      console.log(`  ${day}: ${count} posts`);
    });
}

check30DayPosts().catch(console.error);
