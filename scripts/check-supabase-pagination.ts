#!/usr/bin/env tsx

import { supabaseServer } from '../lib/supabase/server';

async function checkPagination() {
  const supabase = supabaseServer();

  // Try to fetch posts 1000-2000 to see if there are more
  const { data: batch1, error: error1 } = await supabase
    .from('posts')
    .select('date')
    .order('date', { ascending: false })
    .range(0, 999);

  const { data: batch2, error: error2 } = await supabase
    .from('posts')
    .select('date')
    .order('date', { ascending: false })
    .range(1000, 1999);

  const { data: batch3, error: error3 } = await supabase
    .from('posts')
    .select('date')
    .order('date', { ascending: false })
    .range(2000, 2999);

  console.log(`Batch 1 (0-999): ${batch1?.length || 0} posts`);
  if (batch1 && batch1.length > 0) {
    console.log(`  First: ${batch1[0].date}`);
    console.log(`  Last: ${batch1[batch1.length - 1].date}`);
  }

  console.log(`\nBatch 2 (1000-1999): ${batch2?.length || 0} posts`);
  if (batch2 && batch2.length > 0) {
    console.log(`  First: ${batch2[0].date}`);
    console.log(`  Last: ${batch2[batch2.length - 1].date}`);
  }

  console.log(`\nBatch 3 (2000-2999): ${batch3?.length || 0} posts`);
  if (batch3 && batch3.length > 0) {
    console.log(`  First: ${batch3[0].date}`);
    console.log(`  Last: ${batch3[batch3.length - 1].date}`);
  }
}

checkPagination().catch(console.error);
