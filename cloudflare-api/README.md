# adrxor API

Cloudflare Worker + D1 backend for the personal site.

## Current design

- D1 stores blog/research/podcast metadata.
- Blog has full CRUD: create, edit, publish/unpublish, view and delete.
- Research and podcast use public HTTPS file URLs rather than R2. This intentionally avoids Cloudflare R2 billing requirements.
- Admin mutations require Basic Auth using Worker secrets `ADMIN_USER` and `ADMIN_PASS`.

## Deploy

```bash
npx wrangler d1 migrations apply adrxor --remote
npx wrangler deploy
```

Do not put admin credentials in source code.
