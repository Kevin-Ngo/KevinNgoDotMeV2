# kevinngo.me

Kevin Ngô's personal site, built with Astro and deployed to GitHub Pages.

## Development

Install dependencies:

```bash
bun install
```

The project uses Bun 1.3.14, pinned in `package.json` and the deployment
workflow.

Start the development server:

```bash
bun run dev
```

Create and preview a production build:

```bash
bun run build
bun run preview
```

Run all repository checks before publishing:

```bash
bun run verify
bun run audit
```

Use `bun run format` to format supported project files.

## Deployment

The workflow at `.github/workflows/deploy.yml` builds the site and publishes
`dist/` whenever a commit is pushed to `master`. Do not commit `dist/`; GitHub
Actions creates it during deployment. Dependabot checks Bun and GitHub Actions
dependencies weekly.

Repository: [Kevin-Ngo/KevinNgoDotMeV2](https://github.com/Kevin-Ngo/KevinNgoDotMeV2)

Canonical site: [kevinngo.me](https://kevinngo.me/)

### Publish updates

Verify, commit, and push changes to `master`:

```bash
bun install --frozen-lockfile
bun run verify
git status --short
git add path/to/changed-file
git commit -m "Update site"
git push origin master
```

Follow the deployment under the repository's **Actions** tab. To redeploy
without a new commit, open **Actions > Deploy to GitHub Pages** and select
**Run workflow**.

### Custom domain

`public/CNAME` includes the active `kevinngo.me` custom domain in every build.
GitHub Pages should keep **Enforce HTTPS** enabled for that domain.
