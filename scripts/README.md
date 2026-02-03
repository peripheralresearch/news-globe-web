# ICE Video Upload Script

This script uploads ICE protest videos from local storage to OCI Object Storage and inserts metadata into Supabase.

## Prerequisites

### 1. Install Python Dependencies

```bash
pip install oci supabase python-dotenv
```

### 2. Configure OCI

Ensure you have OCI CLI configured with credentials:

```bash
oci setup config
```

This creates `~/.oci/config` with your credentials.

### 3. Create OCI Bucket

```bash
# Set your namespace (find it in OCI console)
export OCI_NAMESPACE="your-namespace"

# Create bucket for ICE videos
oci os bucket create \
  --name geopolitical-mirror-ice-videos \
  --public-access-type ObjectRead \
  --storage-tier Standard

# Verify bucket was created
oci os bucket get --name geopolitical-mirror-ice-videos
```

### 4. Get Supabase Service Role Key

1. Go to Supabase Dashboard
2. Navigate to Project Settings > API
3. Copy the **service_role** secret key (NOT the anon key)

### 5. Create Environment File

Create a `.env` file in the `scripts/` directory:

```bash
# OCI Configuration
OCI_CONFIG_FILE=/Users/yourusername/.oci/config
OCI_CONFIG_PROFILE=DEFAULT
OCI_BUCKET_NAME=geopolitical-mirror-ice-videos
OCI_NAMESPACE=your-oci-namespace
OCI_REGION=ap-melbourne-1

# Supabase Configuration
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Important:** Add `scripts/.env` to `.gitignore` to avoid committing secrets!

## Usage

### Dry Run (Test Without Uploading)

```bash
python scripts/ice-upload.py \
  --videos-json public/data/USA/videos.json \
  --videos-dir public/data/USA/ \
  --country USA \
  --dry-run
```

### Actual Upload

```bash
python scripts/ice-upload.py \
  --videos-json public/data/USA/videos.json \
  --videos-dir public/data/USA/ \
  --country USA
```

### Upload Future Countries

```bash
# Iran videos
python scripts/ice-upload.py \
  --videos-json public/data/Iran/videos.json \
  --videos-dir public/data/Iran/ \
  --country IRAN

# Venezuela videos
python scripts/ice-upload.py \
  --videos-json public/data/Venezuela/videos.json \
  --videos-dir public/data/Venezuela/ \
  --country VENEZUELA
```

## How It Works

1. **Reads `videos.json`**: Parses metadata for all videos
2. **Uploads to OCI**: For each video:
   - Uploads MP4 file to `geopolitical-mirror-ice-videos` bucket
   - Uses path: `{country}/{video_id}.mp4` (e.g., `USA/DTlNci2jyAg.mp4`)
   - Generates public CDN URL
3. **Inserts to Supabase**: Creates record in `ice_videos` table with:
   - Video metadata (title, description, topics)
   - OCI storage references (bucket, object key, public URL)
   - Location data (coordinates, city, state)
   - Engagement metrics (likes, comments)

## Verification

After upload, verify videos are accessible:

### 1. Check OCI Bucket

```bash
# List objects in bucket
oci os object list \
  --bucket-name geopolitical-mirror-ice-videos \
  --prefix USA/

# Get specific object details
oci os object head \
  --bucket-name geopolitical-mirror-ice-videos \
  --name USA/DTlNci2jyAg.mp4
```

### 2. Check Supabase

Run this query in Supabase SQL Editor:

```sql
-- Count videos by country
SELECT country, COUNT(*) as video_count
FROM ice_videos
GROUP BY country;

-- Check sample video
SELECT video_id, title, public_url
FROM ice_videos
WHERE country = 'USA'
LIMIT 5;
```

### 3. Test Public URL

Copy a `public_url` from Supabase and open it in your browser. It should play the video.

### 4. Test API Endpoint

```bash
# Test locally (with dev server running)
curl http://localhost:3000/api/videos/VE | jq '.videos | length'

# Should return: number of Venezuela videos
```

### 5. Test Frontend

1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/venezuela`
3. Map should load with video markers
4. Click a marker - video should play from OCI CDN URL
5. Check browser DevTools Network tab:
   - Should see `/api/videos/VE` request
   - Should NOT see `/data/VE/videos.json` request

## Troubleshooting

### "Missing required environment variables"

Ensure `.env` file exists in `scripts/` directory with all required variables.

### "OCI config file not found"

Run `oci setup config` to create `~/.oci/config`.

### "Bucket not found"

Create the bucket first using the command in Prerequisites section.

### "Supabase insert failed"

- Check `SUPABASE_SERVICE_ROLE_KEY` is correct (not anon key)
- Verify `ice_videos` table exists in Supabase
- Check RLS policies allow service role to insert

### "Video file not found"

Ensure `--videos-dir` points to the correct directory containing MP4 files.

## Cleanup After Successful Upload

Once verified that videos play correctly from OCI:

```bash
# Delete local video files
rm public/data/USA/*.mp4

# Delete static JSON
rm public/data/USA/videos.json

# Keep directory structure for future countries
# (or delete entire USA directory if no longer needed)
```

Update `.gitignore` to prevent future video commits:

```
# .gitignore
public/data/**/*.mp4
public/data/**/*.json
```

## Cost Estimate

**OCI Object Storage:**
- Storage: ~$0.0255 per GB/month (Standard tier)
- 15 videos (~155MB) = ~$0.004/month
- Bandwidth: First 10TB/month free

**Supabase:**
- Free tier: 500MB database, 2GB bandwidth/month
- ICE metadata ~50KB (negligible impact)
- Video URLs stored as text only (videos served from OCI, not Supabase)

**Total estimated cost: <$0.01/month for 15 videos**
