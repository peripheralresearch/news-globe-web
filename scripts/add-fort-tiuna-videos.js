// Videos to add around Fort Tiuna, Caracas
const videos = [
  {
    video_id: 'DTDh_jpAGuM',  // Instagram ID
    title: 'Military helicopters over Caracas - Hawks Aviation',
    channel: 'hawksaviationoficial',
    uploader: 'Hawks Aviation Oficial',
    country: 'VE',
    source_url: 'https://www.instagram.com/hawksaviationoficial/reel/DTDh_jpAGuM',
    latitude: 10.445234,  // Near Fort Tiuna
    longitude: -66.915823,
    published_date: new Date('2025-01-26').toISOString(),
    description: 'Military helicopters flying over Caracas area',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    video_id: '2007358467204636884',  // X/Twitter ID
    title: 'Military activity Fort Tiuna - Twitter Video 1',
    channel: 'Twitter User',
    uploader: 'Twitter',
    country: 'VE',
    source_url: 'https://x.com/i/status/2007358467204636884',
    latitude: 10.446891,  // Slightly north of Fort Tiuna
    longitude: -66.920156,
    published_date: new Date('2025-01-26').toISOString(),
    description: 'Military activity observed near Fort Tiuna',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    video_id: '2007334632988258570',  // X/Twitter ID
    title: 'Military activity Fort Tiuna - Twitter Video 2',
    channel: 'Twitter User',
    uploader: 'Twitter',
    country: 'VE',
    source_url: 'https://x.com/i/status/2007334632988258570',
    latitude: 10.443156,  // Southwest of Fort Tiuna
    longitude: -66.922847,
    published_date: new Date('2025-01-26').toISOString(),
    description: 'Military activity observed near Fort Tiuna',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Add videos via API
async function addVideos() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/add-videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(videos)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Successfully added videos:');
      result.videos.forEach(v => {
        console.log(`  - ${v.title} at [${v.latitude}, ${v.longitude}]`);
      });
    } else {
      console.error('❌ Failed to add videos:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
addVideos();