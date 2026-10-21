# AdonisJS Packages

> Discover the AdonisJS packages to add database, auth, ORM, queue, payment and more integrations into your AdonisJS application.

- 🔗 [Packages listing](https://adonisjs.com/packages)
- 📖 [Package author guide](https://docs.adonisjs.com/guides/packages-development)

## Packages Database

Metadata of AdonisJS packages are maintained in [yml](https://en.wikipedia.org/wiki/YAML) files inside the [./packages](./packages) directory and automatically synced from upstream to fetch latest information.

### Add/Update a package

```bash
pnpm sync <name> <repo>
```

Example: `pnpm sync lucid adonisjs/lucid`

For a package living in a monorepo, create `packages/<name>.yml` with a `directory` field pointing to the package folder (e.g. `directory: packages/core`) before running `pnpm sync <name> <repo>`.

To sync with a branch different than the default, suffix the repo with `#repo-branch`, example: `pnpm sync lucid adonisjs/lucid#next`.

### Contribution

- If you feel a package is missing, please create a new [issue](https://github.com/adonisjs-community/packages/issues/new).
- If some data is outdated please directly open a pull request.

### Using CDN

Compiled JSON data is available from following CDNs:

- **jsdelivr:** https://cdn.jsdelivr.net/npm/@adonisjs/packages@latest/db.json
- **unpkg:** https://unpkg.com/@adonisjs/packages@latest/db.json

### Using npm package

You can use the `@adonisjs/packages` package by installing it in your project:

```bash
# npm
npm install @adonisjs/packages

# pnpm
pnpm add @adonisjs/packages
```

Then you can directly import the list of packages:

```ts
import db from '@adonisjs/packages'
//      ^? { generatedAt, version, categories, packages }
```

The npm package also includes `icons/`. Resolve an entry's `icon` filename relative to that directory and include it in your website's asset build.

### Schema

| Field              | Auto sync | Description                                                                                                                  |
| ------------------ | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `name`             | No        | Canonical name. Must match the filename. |
| `description`      | Yes       | Short description, pulled from upstream `package.json`. |
| `repo`             | No        | GitHub repository. Format is `org/name` or `org/name#branch`. |
| `directory`        | No        | Folder of the package inside a monorepo, e.g. `packages/core`. `npm` and `description` are read from its `package.json`. |
| `npm`              | Yes       | NPM package name. |
| `icon`             | No        | Icon of the package from the [./icons](./icons) directory. |
| `github`           | Yes       | GitHub URL, derived from `repo`. |
| `website`          | No        | Project / docs URL. |
| `category`         | No        | One of the [supported categories](./lib/categories.ts). |
| `type`             | Yes       | `official` (for [adonisjs](https://github.com/adonisjs/)) or `3rd-party`. |
| `maintainers`      | Yes (if empty) | List of maintainers — each item has `name`, `github`, optional `twitter` / `bluesky`. Manual entries are preserved. |
| `compatibility`    | No        | `compatibility.adonis` is a map of AdonisJS major (e.g. `6`, `7`) → label (`6.x`, `7.x`). Keys declare supported majors. |
| `aliases`          | No        | Optional list of old names. |
| `lastCommitAt`     | Bot       | ISO date of default-branch HEAD commit. |
| `lastReleaseAt`    | Bot       | ISO date of latest npm publish. |
| `latestNpmVersion` | Bot       | Latest npm version on `latest` dist-tag. |
| `status`           | Bot       | `healthy` / `stale` / `archived`. Bot auto-sets `archived`/`healthy`; `stale` only via the dashboard PR. |

## Maintenance

### Auto update all current packages

```bash
pnpm sync
```

### Generate `db.json`

```bash
pnpm build
```

### Configure npm publishing

The release workflow publishes public packages from `v*` tags using npm trusted publishing. It runs on GitHub-hosted runners with Node.js 24 and requires no `NPM_TOKEN` secret.

1. If `@adonisjs/packages` does not exist on npm, sign in with an account that can publish under `@adonisjs`. Run `pnpm install --frozen-lockfile`, `pnpm check`, and `npm pack --dry-run`. Inspect the package contents, then run `npm publish --access public` to publish the initial version.
2. In the package's npm settings, add a GitHub Actions trusted publisher with organization `adonisjs-community`, repository `packages`, and workflow filename `release.yml`. Leave the environment blank and allow direct `npm publish`.
3. Complete the first OIDC publication within two days of creating the trusted publisher. After it succeeds, enable "Require two-factor authentication and disallow tokens" in the npm publishing settings.

See the [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers) for account requirements and troubleshooting.

### Publish a new version

From a clean, up-to-date `main` checkout, run:

```bash
pnpm check
pnpm exec tsc --noEmit
npm version patch
git push origin main
git push origin "v$(node -p "require('./package.json').version")"
```

Pushing the tag publishes the package. The tag must match the version in `package.json`. Published versions cannot be reused, including the version published manually during setup.

### Weekly conditional releases

After `Healthcheck (weekly)` succeeds on this repository's `main` branch, `release.yml` checks out the updated `main` and builds the registry. The healthcheck runs on Mondays at 06:00 UTC. A successful manual healthcheck also triggers this comparison.

The prepare job downloads `@adonisjs/packages@latest` from npm and compares its `packages` and `categories` with the local build. Object key order, `generatedAt`, and the registry's `version` do not affect the comparison. Download errors and invalid JSON fail the job instead of triggering an initial publication.

If the data matches, the job does nothing. Otherwise, it uses the next patch of the published version, or keeps the local manifest version if it is already higher. The GitHub App configured for the healthcheck commits only `package.json`, creates `vVERSION`, and pushes the commit and tag atomically. If `main` advanced, the push fails rather than releasing an outdated checkout. The tag starts the existing OIDC publish job in `release.yml`; the prepare job never publishes to npm. Prepare and publish runs share a concurrency group without cancelling an active run.

If publishing fails after the tag was pushed, rerun that tag's failed `Release` run. The prepare job never replaces an existing tag. Changes to packaging or icon files alone require a manual release.

To simulate the comparison, run `Release` from the Actions tab on `main` with `dry_run` enabled, which is the default. The simulation can update `package.json` in its temporary checkout but does not commit, push, tag, or publish. Disable `dry_run` only to prepare a real release.

## Healthiness bot

A weekly GitHub Action keeps the bot-owned metadata fields (`lastCommitAt`, `lastReleaseAt`, `latestNpmVersion`, `status`) fresh by auto-committing directly to `main`. It also maintains a long-lived **Dependency Dashboard** issue (label: `bot:dashboard`) listing actionable curation calls — currently only `Mark as status: stale` proposals (no compat-range or "claim adonis N support" suggestions, since only the package author can verify those).

Tick the checkbox in the dashboard issue → a `bot/healthcheck/<id>` PR opens with that single change.

### One-time setup (maintainer)

1. Repo Settings → Actions → General → **Workflow permissions**: Read and write permissions; check **Allow GitHub Actions to create and approve pull requests**.
2. Create a GitHub App scoped to this repo with: Contents read/write, Issues read/write, Pull requests read/write, Metadata read. Install on the repo.
3. Add two repo secrets: `BOT_APP_ID` and `BOT_APP_PRIVATE_KEY`.
4. Pre-create labels `bot:dashboard` and `bot:auto-pr` on the repo.

Trigger `Healthcheck (weekly)` manually via the Actions tab to kick off the first run.

## License

[MIT](./LICENSE) — Made with ❤️ by the AdonisJS community
