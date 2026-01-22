# Vercel CLI Skill

## Purpose
This skill provides safe, scriptable access to Vercel CLI commands for the `news-globe-web` project under the `peripheral` organization. It wraps common Vercel operations in scripts that enforce security best practices and provide consistent interfaces for deployment and environment management.

## Prerequisites
1. **Vercel CLI Installation**
   ```bash
   npm install -g vercel
   ```

2. **Authentication**
   ```bash
   vercel login
   ```

3. **Project Linking**
   - Project name: `news-globe-web`
   - Organization: `peripheral`
   - Verify with: `vercel project ls`

4. **Scope Verification**
   ```bash
   vercel switch peripheral
   ```

## Available Tools

### 1. deploy-prod.sh
**Purpose**: Deploy current branch to production environment

**Usage**:
```bash
./scripts/deploy-prod.sh
```

**What it does**:
- Runs `vercel --prod` with safety checks
- Confirms production deployment
- Shows deployment URL on success

**Safety notes**:
- Only run from main branch
- Requires confirmation before deploying
- Auto-deploys are already enabled for main branch

---

### 2. deploy-preview.sh
**Purpose**: Create a preview deployment from current branch

**Usage**:
```bash
./scripts/deploy-preview.sh
```

**What it does**:
- Runs `vercel` without production flag
- Creates unique preview URL
- Useful for testing feature branches

**Example output**:
```
Preview: https://news-globe-web-abc123.vercel.app
```

---

### 3. env-list.sh
**Purpose**: List all environment variables by environment

**Usage**:
```bash
./scripts/env-list.sh
```

**What it does**:
- Runs `vercel env ls`
- Shows variables for all environments
- Never displays actual values (only names)

**Example output**:
```
Environment Variables (news-globe-web):

Production:
  NEXT_PUBLIC_MAPBOX_TOKEN
  SUPABASE_URL
  SUPABASE_ANON_KEY
  STRIPE_SECRET_KEY

Preview:
  NEXT_PUBLIC_MAPBOX_TOKEN
  SUPABASE_URL
  SUPABASE_ANON_KEY
```

---

### 4. env-add.sh
**Purpose**: Add environment variable securely without exposing value

**Usage**:
```bash
# Read from stdin (recommended for secrets)
echo -n "secret-value" | ./scripts/env-add.sh KEY_NAME production

# For non-secret values
echo -n "public-value" | ./scripts/env-add.sh NEXT_PUBLIC_KEY preview

# Interactive (will prompt for value)
./scripts/env-add.sh API_KEY production
```

**Parameters**:
- `$1`: Variable name (e.g., `DATABASE_URL`)
- `$2`: Environment (`production`, `preview`, or `development`)

**What it does**:
- Reads value from stdin
- Runs `vercel env add` safely
- Never logs the actual value
- Supports all environment types

**Safety notes**:
- NEVER pass secrets as command arguments
- Always use stdin or interactive mode
- Values are never logged or echoed

---

### 5. logs-view.sh
**Purpose**: View deployment logs for debugging

**Usage**:
```bash
# View latest deployment logs
./scripts/logs-view.sh

# View specific deployment logs
./scripts/logs-view.sh news-globe-web-abc123.vercel.app
```

**What it does**:
- Shows build and function logs
- Useful for debugging deployment failures
- Can filter by deployment URL

---

## Supported Vercel Commands

### Core Commands Used
- `vercel --prod` - Production deployment
- `vercel` - Preview deployment
- `vercel env ls` - List environment variables
- `vercel env add <KEY> <ENV>` - Add environment variable
- `vercel logs <deployment>` - View logs

### Additional Useful Commands (manual use)
- `vercel ls` - List all deployments
- `vercel rm <deployment>` - Remove deployment
- `vercel rollback` - Rollback to previous deployment
- `vercel domains ls` - List project domains
- `vercel secrets ls` - List secrets (deprecated, use env instead)

## Security Best Practices

### ✅ DO
- Use stdin for sensitive values
- Verify project scope before operations
- Confirm production deployments
- Use preview deployments for testing
- Keep environment variables scoped appropriately

### ❌ DON'T
- Echo or log secret values
- Pass secrets as command arguments
- Deploy directly to production without testing
- Share preview URLs containing sensitive data
- Commit `.vercel` directory (it's gitignored)

## Project Configuration

### Current Setup
- **Framework**: Next.js 14.2.35
- **Build Command**: `next build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

### Environment Structure
```
Production (main branch)
├── Auto-deploys from GitHub
├── Public environment variables (NEXT_PUBLIC_*)
└── Secret environment variables

Preview (all other branches)
├── Manual or PR-triggered deploys
├── Separate environment variables
└── Unique URLs per deployment

Development (local)
├── .env.local file
└── Local-only variables
```

### Branch Strategy
- `main` → Production (auto-deploys)
- `dev` → Preview deployments
- Feature branches → Preview deployments

## Troubleshooting

### Authentication Issues
```bash
vercel logout
vercel login
vercel switch peripheral
```

### Project Link Issues
```bash
vercel unlink
vercel link
# Select: peripheral / news-globe-web
```

### Build Failures
```bash
# Check logs
./scripts/logs-view.sh

# Verify environment variables
./scripts/env-list.sh

# Test local build
npm run build
```

### Environment Variable Issues
```bash
# List all variables
./scripts/env-list.sh

# Remove variable
vercel env rm KEY_NAME

# Re-add with correct value
echo -n "new-value" | ./scripts/env-add.sh KEY_NAME production
```

## Integration with CI/CD

The project uses Vercel's GitHub integration for automatic deployments:

1. **Main branch** → Automatic production deployment
2. **Pull requests** → Automatic preview deployments with comments
3. **Other branches** → Manual preview deployments using scripts

Use the scripts in this skill for:
- Emergency production deployments
- Manual preview deployments
- Environment variable management
- Debugging deployment issues

## Quick Reference

```bash
# Deploy to production (from main branch)
./scripts/deploy-prod.sh

# Create preview deployment (from any branch)
./scripts/deploy-preview.sh

# List environment variables
./scripts/env-list.sh

# Add secret environment variable
echo -n "secret" | ./scripts/env-add.sh SECRET_KEY production

# View deployment logs
./scripts/logs-view.sh
```