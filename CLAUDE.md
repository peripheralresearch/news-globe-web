# Web-App Claude Scope

This file defines deployment workflow constraints for `application/web-app`.

## Deployment Model

### Environments
- **Production**: branch `main`, domain `theperipheral.org`
- **Staging**: branch `staging`, domain `staging.theperipheral.org`
- **Preview**: feature branches, domain `*.vercel.app`

### Deployment flow
1. Feature branch
2. Pull request -> `staging`
3. Staging deployment -> `staging.theperipheral.org`
4. Pull request `staging` -> `main`
5. Production deployment -> `theperipheral.org`

## Branch Protection Rules

### `main`
- Pull request required before merging
- 1 approval required
- Dismiss stale approvals on new commits
- Require conversation resolution before merging
- Restrict deletions
- Block force pushes
- Require linear history
- Allowed merge methods: squash or rebase

### `staging`
- Pull request required before merging
- Restrict deletions
- Block force pushes

## Operational Constraints

- Never push directly to `main`
- Create feature branches for all work
- Merge feature branches into `staging` first
- Production changes occur only through `staging` -> `main` pull requests
- Assume Vercel handles deployments automatically from branch updates
