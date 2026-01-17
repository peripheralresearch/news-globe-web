#!/usr/bin/env tsx

import { supabaseServer } from '../lib/supabase/server';

async function checkSupabaseData() {
  console.log('=== Checking Supabase Database ===\n');

  const supabase = supabaseServer();

  // 1. Get total count of posts
  const { count: totalPosts, error: countError } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting posts:', countError);
    return;
  }

  console.log(`Total posts in database: ${totalPosts}\n`);

  // 2. Get date range
  const { data: dateRange, error: dateError } = await supabase
    .from('posts')
    .select('date')
    .order('date', { ascending: true })
    .limit(1);

  const { data: latestDate, error: latestError } = await supabase
    .from('posts')
    .select('date')
    .order('date', { ascending: false })
    .limit(1);

  if (dateError || latestError) {
    console.error('Error fetching date range:', dateError || latestError);
    return;
  }

  console.log(`Oldest post: ${dateRange?.[0]?.date || 'N/A'}`);
  console.log(`Newest post: ${latestDate?.[0]?.date || 'N/A'}\n`);

  // 3. Get ALL posts and group by day (use range to fetch all)
  const { data: allPosts, error: allPostsError } = await supabase
    .from('posts')
    .select('date')
    .order('date', { ascending: false })
    .range(0, 19999); // Fetch up to 20000 rows

  if (allPostsError) {
    console.error('Error fetching all posts:', allPostsError);
    return;
  }

  // Group by day
  const postsByDay: Record<string, number> = {};
  allPosts?.forEach(post => {
    const day = post.date.split('T')[0];
    postsByDay[day] = (postsByDay[day] || 0) + 1;
  });

  console.log(`\nTotal posts fetched: ${allPosts?.length || 0}`);
  console.log(`Unique days with posts: ${Object.keys(postsByDay).length}`);

  console.log('\nAll posts by day (showing all):');
  Object.entries(postsByDay)
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([day, count]) => {
      console.log(`  ${day}: ${count} posts`);
    });

  // Show summary by month
  const postsByMonth: Record<string, number> = {};
  Object.entries(postsByDay).forEach(([day, count]) => {
    const month = day.substring(0, 7); // YYYY-MM
    postsByMonth[month] = (postsByMonth[month] || 0) + count;
  });

  console.log('\nPosts by month:');
  Object.entries(postsByMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .forEach(([month, count]) => {
      console.log(`  ${month}: ${count} posts`);
    });

  // 4. Check media counts
  const { count: mediaCount, error: mediaError } = await supabase
    .from('media')
    .select('*', { count: 'exact', head: true });

  console.log(`\nTotal media items: ${mediaCount || 0}`);

  // 5. Check location links
  const { count: locationLinksCount, error: locationError } = await supabase
    .from('post_locations')
    .select('*', { count: 'exact', head: true });

  console.log(`Total post-location links: ${locationLinksCount || 0}`);

  // 6. Check unique locations
  const { count: uniqueLocations, error: locationsError } = await supabase
    .from('locations_master')
    .select('*', { count: 'exact', head: true });

  console.log(`Total unique locations: ${uniqueLocations || 0}`);
}

checkSupabaseData().catch(console.error);
