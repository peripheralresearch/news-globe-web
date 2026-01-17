# Documentation

Welcome to the Event Horizon project documentation. This directory contains all project documentation organized by purpose and audience.

## Getting Started

**New to the project?** Start here:
1. [Main README.md](../README.md) - Project overview and quickstart
2. [Deployment Guide](deployment.md) - How to deploy the application
3. [Contributing Guide](contributing.md) - How to contribute

## Documentation Structure

### Setup & Deployment
- **[Deployment Guide](deployment.md)** - Production deployment procedures
- **[CI/CD Pipeline](ci-cd.md)** - GitHub Actions workflow documentation
- **[Stripe Setup](setup-STRIPE_SETUP.md)** - Payment processing configuration
- **[Frontend Development](frontend.md)** - Frontend development guidelines

### Architecture & Implementation
Located in `architecture/` subdirectory:
- **[Military Tracking Implementation Plan](architecture/MILITARY_TRACKING_IMPLEMENTATION_PLAN.md)** - Comprehensive plan for military vehicle tracking with cost analysis and database schema
- **[Military Vehicle Tracking Cost Analysis](architecture/MILITARY_VEHICLE_TRACKING_COST_ANALYSIS.md)** - Detailed cost breakdown for flight and maritime tracking APIs
- **[Cost Summary](architecture/COST_SUMMARY.md)** - Quick reference for monthly costs at different scales
- **[Maritime Vessel Tracking APIs](architecture/maritime-vessel-tracking-apis.md)** - Research comparing maritime tracking API providers

### Features
Located in `features/` subdirectory:
- **[Stories Integration](features/STORIES_INTEGRATION.md)** - Real-time story feeds with entity enrichment
- **[Stories Enhancement Summary](features/STORIES_ENHANCEMENT_SUMMARY.md)** - Expandable news items and improvements
- **[Stories Visual Structure](features/STORIES_VISUAL_STRUCTURE.md)** - UI component hierarchy and design

### Issues & Reports
Located in `issues/` subdirectory:
- **[Backend Issues Report](issues/BACKEND_ISSUES_REPORT.md)** - Data quality and filtering issues analysis

### Community & Governance
- **[Code of Conduct](CODE_OF_CONDUCT.md)** - Community standards and enforcement

### Meta & Administrative
Located in `meta/` subdirectory:
- **[Documentation Organization Summary](meta/DOCUMENTATION_ORGANIZATION_SUMMARY.md)** - Records January 17, 2026 documentation reorganization
- **[Story Clustering: 5W1H Reasoning](meta/STORY_CLUSTERING_5W1H_REASONING.md)** - Technical analysis of story clustering architecture

## Quick Links by Role

### For Developers
- [Frontend Development Guide](frontend.md)
- [Deployment Procedures](deployment.md)
- [CI/CD Configuration](ci-cd.md)
- [Architecture Documentation](architecture/)

### For Product Managers
- [Features Documentation](features/)
- [Military Tracking Plan](architecture/MILITARY_TRACKING_IMPLEMENTATION_PLAN.md)
- [Cost Analysis](architecture/MILITARY_VEHICLE_TRACKING_COST_ANALYSIS.md)

### For DevOps/Infrastructure
- [Deployment Guide](deployment.md)
- [CI/CD Setup](ci-cd.md)
- [Stripe Configuration](setup-STRIPE_SETUP.md)

### For QA/Testing
- [Backend Issues Report](issues/BACKEND_ISSUES_REPORT.md)

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Next.js 14
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## Key Features

### Real-time Globe Visualization
- Interactive 3D globe using Mapbox GL JS
- Real-time message plotting with Supabase subscriptions
- Relationship arcs and story-scaled dots

### Stories Feed
- Latest and trending stories from Supabase
- Entity enrichment (locations, people, organizations)
- Real-time updates via Supabase subscriptions

## Common Tasks

### Deploying to Production
See [Deployment Guide](deployment.md)

### Adding a New Feature
1. Check [Frontend Development Guide](frontend.md)
2. Reference existing implementations in [Features](features/)

### Understanding Military Tracking
1. Start with [Implementation Plan](architecture/MILITARY_TRACKING_IMPLEMENTATION_PLAN.md)
2. Review [Cost Analysis](architecture/MILITARY_VEHICLE_TRACKING_COST_ANALYSIS.md)

## Contributing

See [Contributing Guide](contributing.md) for code style and process details.

## License

MIT License - See [LICENSE](../LICENSE) file for details.

---

**Last Updated**: January 2026 