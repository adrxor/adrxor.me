# adrxor-api

Cloudflare Worker backend for the adrxor.me admin panel. It stores research PDFs and podcast audio in R2 and content metadata/posts in D1.

## Setup

1. Install Wrangler: `npm install`
2. Create an R2 bucket named `adrxor-media`.
3. Create a D1 database named `adrxor`; put its ID in `wrangler.toml`.
4. Run `npx wrangler d1 migrations apply adrxor --remote`.
5. Set secrets: `npx wrangler secret put ADMIN_USER` and `npx wrangler secret put ADMIN_PASS`.
6. Deploy with `npx wrangler deploy`.
7. Add `api.adrxor.me` as a Worker custom domain in Cloudflare.

The current admin UI expects `https://api.adrxor.me`. Do not put the admin password in the Git repository.
