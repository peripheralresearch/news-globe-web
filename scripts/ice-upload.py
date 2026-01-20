#!/usr/bin/env python3
"""
ICE Video Upload Script

This script uploads ICE protest videos to OCI Object Storage and inserts
metadata into Supabase. It reads video metadata from videos.json and uploads
the corresponding video files.

Usage:
    python ice-upload.py --videos-json /path/to/videos.json --videos-dir /path/to/videos

Requirements:
    pip install oci supabase python-dotenv

Environment Variables (create .env file):
    OCI_CONFIG_FILE=/path/to/.oci/config
    OCI_CONFIG_PROFILE=DEFAULT
    OCI_BUCKET_NAME=geopolitical-mirror-ice-videos
    OCI_NAMESPACE=your-namespace
    OCI_REGION=ap-melbourne-1

    SUPABASE_URL=https://xxx.supabase.co
    SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
"""

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List
from datetime import datetime

try:
    import oci
    from supabase import create_client, Client
    from dotenv import load_dotenv
except ImportError as e:
    print(f"❌ Missing required package: {e}")
    print("Install with: pip install oci supabase python-dotenv")
    sys.exit(1)


def load_videos_json(json_path: str) -> List[Dict[str, Any]]:
    """Load and parse videos.json file"""
    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
        videos = data.get('videos', [])
        print(f"✅ Loaded {len(videos)} videos from {json_path}")
        return videos
    except Exception as e:
        print(f"❌ Error loading videos.json: {e}")
        sys.exit(1)


def init_oci_client(config_file: str, profile: str) -> oci.object_storage.ObjectStorageClient:
    """Initialize OCI Object Storage client"""
    try:
        config = oci.config.from_file(config_file, profile)
        client = oci.object_storage.ObjectStorageClient(config)
        print(f"✅ OCI client initialized (profile: {profile})")
        return client
    except Exception as e:
        print(f"❌ Error initializing OCI client: {e}")
        sys.exit(1)


def init_supabase_client(url: str, service_key: str) -> Client:
    """Initialize Supabase client with service role key"""
    try:
        client = create_client(url, service_key)
        print(f"✅ Supabase client initialized")
        return client
    except Exception as e:
        print(f"❌ Error initializing Supabase client: {e}")
        sys.exit(1)


def get_video_file_path(videos_dir: Path, video: Dict[str, Any]) -> Path:
    """Get the full path to the video file"""
    video_file = video.get('video_file', '')
    # Remove leading /data/USA/ if present
    video_file = video_file.replace('/data/USA/', '')
    return videos_dir / video_file


def upload_to_oci(
    client: oci.object_storage.ObjectStorageClient,
    namespace: str,
    bucket: str,
    object_key: str,
    file_path: Path
) -> str:
    """Upload video file to OCI Object Storage and return public URL"""
    try:
        print(f"  📤 Uploading to OCI: {object_key}")

        with open(file_path, 'rb') as f:
            client.put_object(
                namespace_name=namespace,
                bucket_name=bucket,
                object_name=object_key,
                put_object_body=f
            )

        # Generate public URL (assumes bucket has public access)
        region = os.getenv('OCI_REGION', 'ap-melbourne-1')
        public_url = f"https://objectstorage.{region}.oraclecloud.com/n/{namespace}/b/{bucket}/o/{object_key}"

        print(f"  ✅ Uploaded: {public_url}")
        return public_url
    except Exception as e:
        print(f"  ❌ Error uploading to OCI: {e}")
        raise


def insert_to_supabase(
    client: Client,
    video: Dict[str, Any],
    oci_bucket: str,
    oci_object_key: str,
    public_url: str,
    country: str
) -> None:
    """Insert video metadata into Supabase ice_videos table"""
    try:
        print(f"  💾 Inserting metadata to Supabase...")

        # Extract engagement metrics
        engagement = video.get('engagement', {})
        location = video.get('location', {})

        # Prepare record
        record = {
            'video_id': video.get('id'),
            'source_platform': 'instagram',
            'source_url': video.get('instagram_url'),
            'title': video.get('title'),
            'description': video.get('description'),
            'country': country,
            'topics': video.get('topics', []),
            'uploader': video.get('uploader'),
            'channel': video.get('channel'),
            'published_date': video.get('published_date'),
            'duration_seconds': video.get('duration'),
            'oci_bucket': oci_bucket,
            'oci_object_key': oci_object_key,
            'public_url': public_url,
            'mime_type': 'video/mp4',
            'location_name': location.get('name'),
            'latitude': location.get('latitude'),
            'longitude': location.get('longitude'),
            'city': location.get('city'),
            'state': location.get('state'),
            'likes': engagement.get('likes'),
            'comments': engagement.get('comments')
        }

        # Insert into Supabase
        result = client.table('ice_videos').insert(record).execute()

        print(f"  ✅ Inserted record for video_id: {video.get('id')}")
    except Exception as e:
        print(f"  ❌ Error inserting to Supabase: {e}")
        raise


def process_videos(
    videos: List[Dict[str, Any]],
    videos_dir: Path,
    oci_client: oci.object_storage.ObjectStorageClient,
    supabase_client: Client,
    oci_namespace: str,
    oci_bucket: str,
    country: str,
    dry_run: bool = False
) -> None:
    """Process all videos: upload to OCI and insert to Supabase"""

    print(f"\n{'=' * 60}")
    print(f"Processing {len(videos)} videos")
    print(f"Country: {country}")
    print(f"Dry run: {dry_run}")
    print(f"{'=' * 60}\n")

    successful = 0
    failed = 0

    for i, video in enumerate(videos, 1):
        video_id = video.get('id')
        print(f"\n[{i}/{len(videos)}] Processing video: {video_id}")
        print(f"  Title: {video.get('title')}")

        try:
            # Get video file path
            video_file = get_video_file_path(videos_dir, video)
            if not video_file.exists():
                print(f"  ⚠️  Video file not found: {video_file}")
                failed += 1
                continue

            # Get file size
            file_size = video_file.stat().st_size
            file_size_mb = file_size / (1024 * 1024)
            print(f"  📁 File size: {file_size_mb:.2f} MB")

            # Generate object key
            object_key = f"{country}/{video_id}.mp4"

            if dry_run:
                print(f"  [DRY RUN] Would upload: {object_key}")
                print(f"  [DRY RUN] Would insert metadata to Supabase")
                successful += 1
                continue

            # Upload to OCI
            public_url = upload_to_oci(
                oci_client,
                oci_namespace,
                oci_bucket,
                object_key,
                video_file
            )

            # Insert to Supabase
            insert_to_supabase(
                supabase_client,
                video,
                oci_bucket,
                object_key,
                public_url,
                country
            )

            successful += 1
            print(f"  ✅ Success!")

        except Exception as e:
            print(f"  ❌ Failed: {e}")
            failed += 1
            continue

    # Summary
    print(f"\n{'=' * 60}")
    print(f"Upload Summary")
    print(f"{'=' * 60}")
    print(f"Total videos: {len(videos)}")
    print(f"Successful: {successful}")
    print(f"Failed: {failed}")
    print(f"{'=' * 60}\n")


def main():
    parser = argparse.ArgumentParser(
        description='Upload ICE videos to OCI and Supabase',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    parser.add_argument(
        '--videos-json',
        required=True,
        help='Path to videos.json file'
    )
    parser.add_argument(
        '--videos-dir',
        required=True,
        help='Directory containing video files'
    )
    parser.add_argument(
        '--country',
        default='USA',
        help='Country code (default: USA)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simulate upload without actually uploading'
    )
    parser.add_argument(
        '--env-file',
        default='.env',
        help='Path to .env file (default: .env)'
    )

    args = parser.parse_args()

    # Load environment variables
    if os.path.exists(args.env_file):
        load_dotenv(args.env_file)
        print(f"✅ Loaded environment from {args.env_file}")
    else:
        print(f"⚠️  No .env file found at {args.env_file}, using system environment")

    # Validate environment variables
    required_env = [
        'OCI_CONFIG_FILE',
        'OCI_NAMESPACE',
        'OCI_BUCKET_NAME',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
    ]

    missing = [var for var in required_env if not os.getenv(var)]
    if missing:
        print(f"❌ Missing required environment variables: {', '.join(missing)}")
        sys.exit(1)

    # Initialize clients
    oci_client = init_oci_client(
        os.getenv('OCI_CONFIG_FILE'),
        os.getenv('OCI_CONFIG_PROFILE', 'DEFAULT')
    )

    supabase_client = init_supabase_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    )

    # Load videos
    videos = load_videos_json(args.videos_json)

    # Process videos
    process_videos(
        videos,
        Path(args.videos_dir),
        oci_client,
        supabase_client,
        os.getenv('OCI_NAMESPACE'),
        os.getenv('OCI_BUCKET_NAME'),
        args.country.upper(),
        args.dry_run
    )


if __name__ == '__main__':
    main()
