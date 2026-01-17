# Documentation File Guide

**Quick reference for finding documentation in Event Horizon**

## Most Frequently Needed Documents

### Getting Started (New Developers)
```
1. /README.md ........................... Project overview
2. /docs/README.md ..................... Documentation index
3. /docs/frontend.md ................... Frontend setup
4. /docs/deployment.md ................. How to deploy
```

### Configuration & Secrets
```
/docs/setup-STRIPE_SETUP.md ........... Stripe payment setup
/docs/ci-cd.md ........................ GitHub Actions
```

### Understanding the Architecture
```
/docs/architecture/
├── MILITARY_TRACKING_IMPLEMENTATION_PLAN.md ... System design
├── maritime-vessel-tracking-apis.md ........... API research
└── COST_SUMMARY.md ....................... Cost reference
```

### Feature Documentation
```
/docs/features/
├── STORIES_INTEGRATION.md .............. Story feed feature
├── STORIES_VISUAL_STRUCTURE.md ......... UI design
└── STORIES_ENHANCEMENT_SUMMARY.md ...... Improvements
```

### Troubleshooting & Issues
```
/docs/issues/
└── BACKEND_ISSUES_REPORT.md ........... Known issues
```

### Community & Contributing
```
/docs/CODE_OF_CONDUCT.md ............... Community standards
/docs/contributing.md .................. How to contribute
```

### Reference & Analysis
```
/docs/meta/
├── DOCUMENTATION_ORGANIZATION_SUMMARY.md ... Docs structure
└── STORY_CLUSTERING_5W1H_REASONING.md ...... Clustering analysis
```

---

## By Role

### Frontend Developer
```
Primary:
  /docs/frontend.md
  /docs/features/STORIES_VISUAL_STRUCTURE.md

Reference:
  /docs/deployment.md
  /.claude/context.md (comprehensive overview)
```

### Backend Developer
```
Primary:
  /.claude/supabase-skillset.md
  /.claude/SUPABASE_SCHEMA.md
  /docs/architecture/ (all files)

Reference:
  /docs/issues/BACKEND_ISSUES_REPORT.md
  /docs/features/ (all files)
```

### DevOps Engineer
```
Primary:
  /docs/deployment.md
  /docs/ci-cd.md
  /docs/setup-STRIPE_SETUP.md

Reference:
  /docs/frontend.md
```

### Product Manager
```
Primary:
  /docs/architecture/MILITARY_TRACKING_IMPLEMENTATION_PLAN.md
  /docs/architecture/COST_SUMMARY.md
  /docs/features/ (all files)

Reference:
  /docs/README.md (overview)
```

### QA/Tester
```
Primary:
  /docs/issues/BACKEND_ISSUES_REPORT.md
  /docs/frontend.md

Reference:
  /docs/features/ (all files)
```

### DevRel/Technical Writer
```
Primary:
  /docs/README.md (index structure)
  /docs/meta/DOCUMENTATION_ORGANIZATION_SUMMARY.md
  /docs/contributing.md

Reference:
  All other files (to update and maintain)
```

---

## By Topic

### Deployment & Production
```
/docs/deployment.md
/docs/ci-cd.md
/docs/setup-STRIPE_SETUP.md
/docs/frontend.md (development setup)
```

### Architecture & Design
```
/docs/architecture/MILITARY_TRACKING_IMPLEMENTATION_PLAN.md
/docs/architecture/maritime-vessel-tracking-apis.md
/docs/architecture/COST_SUMMARY.md
/docs/architecture/MILITARY_VEHICLE_TRACKING_COST_ANALYSIS.md
/docs/meta/STORY_CLUSTERING_5W1H_REASONING.md
```

### Features
```
/docs/features/STORIES_INTEGRATION.md
/docs/features/STORIES_VISUAL_STRUCTURE.md
/docs/features/STORIES_ENHANCEMENT_SUMMARY.md
```

### Data & Database
```
/.claude/SUPABASE_SCHEMA.md
/.claude/supabase-skillset.md
/.claude/context.md (includes database info)
```

### Quality & Issues
```
/docs/issues/BACKEND_ISSUES_REPORT.md
```

### Community & Process
```
/docs/CODE_OF_CONDUCT.md
/docs/contributing.md
```

### Documentation & Reference
```
/docs/README.md (index)
/docs/meta/DOCUMENTATION_ORGANIZATION_SUMMARY.md
/docs/meta/STORY_CLUSTERING_5W1H_REASONING.md
```

---

## Directory Structure

```
docs/
├── README.md (INDEX - START HERE)
│
├── Root Level (Operational Documentation)
│   ├── CODE_OF_CONDUCT.md
│   ├── ci-cd.md
│   ├── contributing.md
│   ├── deployment.md
│   ├── frontend.md
│   └── setup-STRIPE_SETUP.md
│
├── architecture/ (System Design)
│   ├── COST_SUMMARY.md
│   ├── MILITARY_TRACKING_IMPLEMENTATION_PLAN.md
│   ├── MILITARY_VEHICLE_TRACKING_COST_ANALYSIS.md
│   └── maritime-vessel-tracking-apis.md
│
├── features/ (Feature Documentation)
│   ├── STORIES_ENHANCEMENT_SUMMARY.md
│   ├── STORIES_INTEGRATION.md
│   └── STORIES_VISUAL_STRUCTURE.md
│
├── issues/ (Quality Assurance)
│   └── BACKEND_ISSUES_REPORT.md
│
├── meta/ (Administrative & Reference)
│   ├── README.md
│   ├── DOCUMENTATION_ORGANIZATION_SUMMARY.md
│   └── STORY_CLUSTERING_5W1H_REASONING.md
│
└── api/ (Ready for API Documentation)
```

---

## Common Questions: Where to Find...

### "How do I set up the project?"
→ `/docs/frontend.md`

### "How do I deploy to production?"
→ `/docs/deployment.md`

### "How do I set up Stripe payments?"
→ `/docs/setup-STRIPE_SETUP.md`

### "How do I set up CI/CD?"
→ `/docs/ci-cd.md`

### "What's the database schema?"
→ `/.claude/SUPABASE_SCHEMA.md`

### "How do I work with Supabase?"
→ `/.claude/supabase-skillset.md`

### "What features exist?"
→ `/docs/features/` directory

### "What are known issues?"
→ `/docs/issues/BACKEND_ISSUES_REPORT.md`

### "What's the system architecture?"
→ `/docs/architecture/MILITARY_TRACKING_IMPLEMENTATION_PLAN.md`

### "What does this project do?"
→ `/README.md` (root) or `/docs/README.md`

### "How do I contribute?"
→ `/docs/contributing.md`

### "What are community standards?"
→ `/docs/CODE_OF_CONDUCT.md`

### "How is documentation organized?"
→ `/docs/meta/DOCUMENTATION_ORGANIZATION_SUMMARY.md`

### "How does story clustering work?"
→ `/docs/meta/STORY_CLUSTERING_5W1H_REASONING.md`

---

## Documentation Sizes (Reference)

| File | Size | Read Time |
|------|------|-----------|
| DOCUMENTATION_ORGANIZATION_SUMMARY.md | 12 KB | 15 min |
| MILITARY_TRACKING_IMPLEMENTATION_PLAN.md | 22 KB | 30 min |
| MILITARY_VEHICLE_TRACKING_COST_ANALYSIS.md | 21 KB | 25 min |
| STORY_CLUSTERING_5W1H_REASONING.md | 13 KB | 20 min |
| BACKEND_ISSUES_REPORT.md | 33 KB | 40 min |
| maritime-vessel-tracking-apis.md | 37 KB | 45 min |
| context.md (/.claude/) | 50 KB | 60 min |

---

## Last Updated

January 17, 2026

This guide was created to help team members quickly locate the documentation they need. For the complete documentation index, see `/docs/README.md`.
