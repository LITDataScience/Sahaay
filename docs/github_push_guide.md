# Sahaay V3 - GitHub / GitLab Push Guide

Sahaay utilizes a **Zero-Trust CI/CD Pipeline**. Direct pushes to `main` are protected, and all code must pass strict `tRPC` type safety checks before it can be bundled by Expo Application Services (EAS).

Follow this guide to ensure your changes are deployed successfully without crashing the cloud builders.

## 1. Local Pre-Flight Checks

Before you commit any code, run the type checker and linter locally to catch errors that will fail the GitHub Actions pipeline.

```bash
# From the repository root
pnpm install

# Check the entire monorepo for TypeScript strict mode errors
pnpm --filter "*" run typecheck

# Check for ESLint violations
pnpm --filter "*" run lint
```

## 2. Commit Message Standards (Conventional Commits)

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification. This allows us to auto-generate changelogs and trigger specific CI behaviors.

Format: `<type>(<scope>): <short description>`

### Allowed Types

- `feat`: A new feature (e.g., adding a new screen or API endpoint)
- `fix`: A bug fix (e.g., patching a crash or resolving an ERESOLVE conflict)
- `chore`: Maintenance work (e.g., updating `eas.json` or `package.json`)
- `docs`: Documentation updates only (e.g., updating `README.md`)
- `refactor`: Code changes that neither fix bugs nor add features (e.g., migrating to XState V5)

### Examples

- `feat(frontend): implement Typesense global search UI`
- `fix(backend): resolve tRPC strict compiler error in BookingService`
- `chore(ci): pin typescript dependency to ^5.7.2`
- `docs: purge v1 imperative routing documentation`

## 3. The Git Flow (Creating PRs)

Do not push directly to `main` unless it is a critical hotfix.

```bash
# 1. Create a new descriptive branch
git checkout -b feat/add-user-profiles

# 2. Add your modified files
git add .

# 3. Commit using the conventional format
git commit -m "feat(frontend): create user profile screen with Expo Router"

# 4. Push to origin
git push origin feat/add-user-profiles
```

Once pushed, open a **Pull Request (PR)** on GitHub.

## 4. The CI/CD Pipeline Behaviors

When you open a PR or push to `main`, GitHub Actions automatically triggers.

### What the Actions Do

1. **Frontend Quality Check (`frontend-quality.yml`)**: Boots up Node 20, installs `pnpm`, and runs `eslint` and `tsc --noEmit`. If your code has syntax errors or type assertions (`as any`) that violate strict mode, **the build fails immediately**.
2. **EAS Build Gate (`eas-build.yml`)**: If the quality check passes, it intercepts your PR.
    - If it's a **Pull Request**, it builds an Android `preview` APK locally to verify the native bundler won't crash on compilation.
    - If it's a push to **`main`**, it triggers a live `production`/`preview` push to Expo's cloud servers, outputting the shareable Native APK.

If a GitHub Action fails (red "X"), click "Details" on the failed check, look for the `tsc` or `eas build` log phase, identify the specific compilation failure line, fix it locally, and push an updated commit.
