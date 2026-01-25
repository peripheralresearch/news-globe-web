// Special pin for Maduro capture location at Fort Tiuna
const captureLocation = {
  video_id: 'maduro-capture-fort-tiuna',  // Special ID
  title: 'Nicolás Maduro Captured - Fort Tiuna',
  channel: 'Breaking News',
  uploader: 'Event Marker',
  country: 'VE',
  source_url: null,  // No video link
  public_url: null,   // No video file
  latitude: 10.4408,  // Fort Tiuna coordinates
  longitude: -66.9091,
  published_date: new Date('2025-01-26').toISOString(),
  description: 'Location where Nicolás Maduro was reportedly captured at Fort Tiuna military base, Caracas, Venezuela. This marks a historic turning point in Venezuelan politics.',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Add capture location via API
async function addCaptureLocation() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/add-videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([captureLocation])
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Successfully added Maduro capture location:');
      console.log(`  - ${captureLocation.title} at Fort Tiuna [${captureLocation.latitude}, ${captureLocation.longitude}]`);
    } else {
      console.error('❌ Failed to add capture location:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the script
addCaptureLocation();