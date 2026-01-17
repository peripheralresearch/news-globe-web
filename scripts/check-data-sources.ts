#!/usr/bin/env tsx

import { supabaseServer } from '../lib/supabase/server';

async function checkDataSources() {
  const supabase = supabaseServer();

  console.log('=== Checking Data Sources ===\n');

  // Get unique channels from last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: posts, error } = await supabase
    .from('posts')
    .select('channel_name, channel_username, date')
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: false })
    .range(0, 4999);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total posts fetched: ${posts?.length || 0}\n`);

  // Group by channel
  const byChannel: Record<string, number> = {};
  posts?.forEach(p => {
    const channel = p.channel_name || p.channel_username || 'Unknown';
    byChannel[channel] = (byChannel[channel] || 0) + 1;
  });

  console.log('Posts by channel (sorted by count):');
  Object.entries(byChannel)
    .sort(([, a], [, b]) => b - a)
    .forEach(([channel, count]) => {
      console.log(`  ${channel}: ${count} posts`);
    });

  console.log(`\nUnique channels: ${Object.keys(byChannel).length}`);

  // Check if there are any non-Telegram sources
  const telegramChannels = Object.keys(byChannel).filter(ch =>
    ch.toLowerCase().includes('telegram') ||
    ch.toLowerCase().includes('channel')
  );

  const nonTelegramChannels = Object.keys(byChannel).filter(ch =>
    !ch.toLowerCase().includes('telegram') &&
    !ch.toLowerCase().includes('channel')
  );

  console.log(`\nTelegram-related channels: ${telegramChannels.length}`);
  console.log(`Other sources: ${nonTelegramChannels.length}`);

  if (nonTelegramChannels.length > 0) {
    console.log('\nNon-Telegram sources:');
    nonTelegramChannels.forEach(ch => {
      console.log(`  - ${ch}: ${byChannel[ch]} posts`);
    });
  }
}

checkDataSources().catch(console.error);
