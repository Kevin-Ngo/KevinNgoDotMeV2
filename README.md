# kevinngo.me

Kevin Ngo's personal site, built with Astro and deployed to GitHub Pages.

## Development

Install dependencies:

```bash
bun install
```

Start the development server:

```bash
bun run dev
```

Create and preview a production build:

```bash
bun run build
bun run preview
```

## Deployment

The workflow at `.github/workflows/deploy.yml` builds the site and publishes
`dist/` whenever a commit is pushed to `master`. Do not commit `dist/`; GitHub
Actions creates it during deployment.

Repository: [Kevin-Ngo/KevinNgoDotMeV2](https://github.com/Kevin-Ngo/KevinNgoDotMeV2)

Current Pages deployment: [kevin-ngo.github.io/KevinNgoDotMeV2](https://kevin-ngo.github.io/KevinNgoDotMeV2/)

### Publish updates

Verify, commit, and push changes to `master`:

```bash
bun install --frozen-lockfile
bun run build
git add .
git commit -m "Update site"
git push origin master
```

Follow the deployment under the repository's **Actions** tab. To redeploy
without a new commit, open **Actions > Deploy to GitHub Pages** and select
**Run workflow**.

### Custom domain

`public/CNAME` includes `kevinngo.me` in every build. To move the domain to this
repository, set `kevinngo.me` under **Settings > Pages > Custom domain**, verify
the DNS records, and enable **Enforce HTTPS** after GitHub issues the certificate.
