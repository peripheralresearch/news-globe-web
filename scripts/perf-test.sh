#!/usr/bin/env bash
# Globe page performance test script
# Usage: ./scripts/perf-test.sh [--prod]
#
# Measures:
#   1. API response time (3 runs, min/avg/max TTFB)
#   2. Bundle size (/globe First Load JS from next build output)
#   3. Page load time with 4x CPU throttling via Playwright + CDP
#
# Dependencies: curl (required), npx (optional for bundle + page load)
# Does NOT install any packages.

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

LOCAL_API_URL="http://localhost:3000/api/sentinel/globe?limit=35&hours=168"
PROD_API_URL="https://news-globe-web.vercel.app/api/sentinel/globe?limit=35&hours=168"
LOCAL_PAGE_URL="http://localhost:3000/globe"
RUNS=3
USE_PROD=false

# Parse flags
for arg in "$@"; do
  case "$arg" in
    --prod) USE_PROD=true ;;
  esac
done

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# bc is not always available; use awk for arithmetic
awk_calc() {
  awk "BEGIN { printf \"%.0f\", $1 }"
}

awk_div() {
  # awk_div numerator denominator -> integer result
  awk "BEGIN { printf \"%.0f\", ($1) / ($2) }"
}

# ---------------------------------------------------------------------------
# Section 1: API Response Time
# ---------------------------------------------------------------------------

measure_api() {
  local url="$1"
  local label="$2"

  echo ""
  echo "Measuring API: $label"
  echo "  URL: $url"

  local ttfb_sum=0
  local ttfb_min=999999
  local ttfb_max=0
  local total_sum=0
  local size_kb=0

  for i in $(seq 1 $RUNS); do
    # curl write-out format; times are in seconds (floating point)
    local result
    result=$(curl -s -o /tmp/perf_globe_response.json \
      -w "%{time_namedlookup} %{time_connect} %{time_starttransfer} %{time_total} %{size_download}" \
      --max-time 60 \
      "$url" 2>/dev/null) || {
        echo "  Run $i: curl failed (is the server running?)"
        continue
      }

    local dns_s connect_s ttfb_s total_s bytes
    read -r dns_s connect_s ttfb_s total_s bytes <<< "$result"

    # Convert seconds to milliseconds (integer) via awk
    local ttfb_ms total_ms
    ttfb_ms=$(awk_calc "$ttfb_s * 1000")
    total_ms=$(awk_calc "$total_s * 1000")
    size_kb=$(awk_calc "$bytes / 1024")

    echo "  Run $i: DNS=${dns_s}s  Connect=${connect_s}s  TTFB=${ttfb_ms}ms  Total=${total_ms}ms  Size=${size_kb}kb"

    ttfb_sum=$((ttfb_sum + ttfb_ms))
    total_sum=$((total_sum + total_ms))

    if [ "$ttfb_ms" -lt "$ttfb_min" ]; then ttfb_min=$ttfb_ms; fi
    if [ "$ttfb_ms" -gt "$ttfb_max" ]; then ttfb_max=$ttfb_ms; fi
  done

  local ttfb_avg=0
  if [ "$RUNS" -gt 0 ]; then
    ttfb_avg=$(awk_div "$ttfb_sum" "$RUNS")
  fi

  # Export for summary table
  API_TTFB_MIN="$ttfb_min"
  API_TTFB_AVG="$ttfb_avg"
  API_TTFB_MAX="$ttfb_max"
  API_PAYLOAD_KB="$size_kb"
}

# ---------------------------------------------------------------------------
# Section 2: Bundle Size Analysis
# ---------------------------------------------------------------------------

measure_bundle() {
  echo ""
  echo "Analyzing bundle size (npx next build --no-lint)..."
  echo "  This may take 1-2 minutes."

  if ! command -v npx &>/dev/null; then
    echo "  npx not found — skipping bundle analysis."
    BUNDLE_GLOBE_JS="N/A"
    BUNDLE_TOTAL="N/A"
    return
  fi

  local build_output
  # Run from the project root (script is in scripts/, project root is one level up)
  local project_root
  project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

  build_output=$(cd "$project_root" && npx next build --no-lint 2>&1) || true

  # Extract /globe route line — next build outputs a table like:
  #   ○ /globe  X.xx kB  XXX kB
  # Capture the First Load JS column (last number on the /globe line)
  local globe_line
  globe_line=$(echo "$build_output" | grep -E '^\s*[○●λ]\s*/globe(\s|$)' | tail -1) || true

  if [ -n "$globe_line" ]; then
    # The last two tokens are "Size" and "First Load JS" — grab the last one
    BUNDLE_GLOBE_JS=$(echo "$globe_line" | awk '{print $(NF-1), $NF}')
  else
    BUNDLE_GLOBE_JS="N/A (route not found in build output)"
  fi

  # Extract total First Load JS shared by all — next prints a summary line like:
  #   + First Load JS shared by all  XXX kB
  local shared_line
  shared_line=$(echo "$build_output" | grep -i 'First Load JS shared by all' | tail -1) || true

  if [ -n "$shared_line" ]; then
    BUNDLE_TOTAL=$(echo "$shared_line" | awk '{print $(NF-1), $NF}')
  else
    BUNDLE_TOTAL="N/A"
  fi

  echo "  Build complete."
}

# ---------------------------------------------------------------------------
# Section 3: Page Load with Playwright + 4x CPU Throttling
# ---------------------------------------------------------------------------

measure_page_load() {
  local url="$1"

  echo ""
  echo "Measuring page load (4x CPU throttle) via Playwright..."
  echo "  URL: $url"

  if ! command -v npx &>/dev/null; then
    echo "  npx not found — skipping page load measurement."
    PAGE_LOAD_MS="N/A"
    return
  fi

  # Check whether playwright is resolvable in the local project
  local project_root
  project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

  if ! (cd "$project_root" && npx --no playwright --version &>/dev/null 2>&1); then
    echo "  Playwright not installed in this project — skipping page load measurement."
    echo "  To enable: npm install -D playwright && npx playwright install chromium"
    PAGE_LOAD_MS="N/A"
    return
  fi

  # Write an inline Playwright script to a temp file
  local pw_script
  pw_script=$(mktemp /tmp/perf_globe_pw_XXXXXX.js)

  cat > "$pw_script" <<'PLAYWRIGHT_SCRIPT'
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Connect CDP to apply CPU throttling
  const client = await context.newCDPSession(page);
  await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  const startMs = Date.now();

  await page.goto(process.argv[2], { waitUntil: 'domcontentloaded', timeout: 90000 });

  // Wait for the loading overlay to disappear:
  // The overlay contains a <p> with "Loading globe data" text.
  // When isLoading becomes false the overlay is removed from the DOM.
  try {
    await page.waitForFunction(
      () => !document.querySelector('p') ||
            ![...document.querySelectorAll('p')]
              .some(el => el.textContent && el.textContent.includes('Loading globe data')),
      { timeout: 60000 }
    );
  } catch (_e) {
    // Timeout waiting for overlay — report partial time
  }

  const elapsed = Date.now() - startMs;
  console.log(elapsed);

  await browser.close();
})().catch(err => {
  console.error('Playwright error:', err.message);
  process.exit(1);
});
PLAYWRIGHT_SCRIPT

  local result
  result=$(cd "$project_root" && npx --no playwright node "$pw_script" "$url" 2>/dev/null) || {
    echo "  Playwright run failed — skipping."
    PAGE_LOAD_MS="N/A"
    rm -f "$pw_script"
    return
  }

  rm -f "$pw_script"

  PAGE_LOAD_MS="${result}ms"
  echo "  Measured: $PAGE_LOAD_MS"
}

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

echo ""
echo "=== Globe Performance Report ==="
echo "Date: $(date)"
echo ""

# Decide which API URL to use
if [ "$USE_PROD" = "true" ]; then
  API_LABEL="Production"
  API_URL="$PROD_API_URL"
  PAGE_URL="https://news-globe-web.vercel.app/globe"
else
  API_LABEL="Local (localhost:3000)"
  API_URL="$LOCAL_API_URL"
  PAGE_URL="$LOCAL_PAGE_URL"
fi

# Initialize result variables so summary never references unset vars
API_TTFB_MIN="N/A"
API_TTFB_AVG="N/A"
API_TTFB_MAX="N/A"
API_PAYLOAD_KB="N/A"
BUNDLE_GLOBE_JS="N/A"
BUNDLE_TOTAL="N/A"
PAGE_LOAD_MS="N/A"

# Run measurements
measure_api "$API_URL" "$API_LABEL"
measure_bundle
measure_page_load "$PAGE_URL"

# ---------------------------------------------------------------------------
# Summary Table
# ---------------------------------------------------------------------------

echo ""
echo "========================================"
echo "=== Globe Performance Report Summary ==="
echo "========================================"
echo "Date: $(date)"
echo ""
echo "API Response ($API_LABEL, $RUNS runs):"
echo "  Min TTFB:  ${API_TTFB_MIN}ms"
echo "  Avg TTFB:  ${API_TTFB_AVG}ms"
echo "  Max TTFB:  ${API_TTFB_MAX}ms"
echo "  Payload:   ${API_PAYLOAD_KB}kb"
echo ""
echo "Bundle Size:"
echo "  /globe First Load JS: ${BUNDLE_GLOBE_JS}"
echo "  Shared by all:        ${BUNDLE_TOTAL}"
echo ""
echo "Page Load (4x CPU throttle):"
echo "  Time to interactive: ${PAGE_LOAD_MS}"
echo ""
