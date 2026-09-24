# Self-hosted deployment files

These are the source files for Cut's **Coolify** and **Dokploy** deployments.
Both run the published image
[`ghcr.io/mendylanda/cut`](https://github.com/MendyLanda/cut/pkgs/container/cut)
(built by [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml))
alongside a private, persistent Redis — so each is a self-contained stack.

## `coolify/`

- `cut.yaml` — the Compose definition (uses Coolify magic vars:
  `SERVICE_FQDN_CUT_3000` for routing, `SERVICE_PASSWORD_ADMIN` for the admin
  password).
- `svgs/cut.svg` — the logo prepared for a future catalog entry.

Coolify does not list Cut in its service catalog. Create a Docker Compose Empty
service and paste the stack from the [main README](../README.md#coolify).

## `dokploy/`

- `docker-compose.yml` — the stack.
- `template.toml` — Dokploy config: generates the domain (`${domain}`) and a
  strong `ADMIN_PASSWORD` (`${password:24}`), and maps the domain to the `cut`
  service on port 3000.
- `cut.svg` — the logo.
- `meta.entry.json` — the object to add to the catalog's root `meta.json`.

Submitted to [`Dokploy/templates`](https://github.com/Dokploy/templates) as
`blueprints/cut/{docker-compose.yml,template.toml,cut.svg}` + an entry in
`meta.json`.

## Updating the image

Both templates pin `:latest`. Cutting a `v*.*.*` release tag (or pushing to
`main`) rebuilds and republishes the image via the GHCR workflow; existing
deployments pull the new image on their next redeploy.
