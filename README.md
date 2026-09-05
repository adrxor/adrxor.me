# adrxor.me

Personal website for Adrian — ML/AI Engineer.

## Stack
- Astro + GitHub Pages for the public static site
- Markdown files in `src/content/blog/` for blog posts
- Static PDFs in `public/research/` for research
- GitHub links for projects
- External platform links for the future podcast

There is intentionally no database, Cloudflare Worker, R2 bucket, or runtime CMS backend.

## Local development

```bash
npm install
npm run dev
```

Then open `http://localhost:4321`.

## Build

```bash
npm run build
```

## Admin

The `/admin/` page uses the GitHub Contents API directly from the browser. Create a GitHub fine-grained personal access token limited to the `adrxor/adrxor.me` repository with **Contents: Read and write**, then enter it in the admin panel.

The token is kept only in `sessionStorage` and is sent only to `api.github.com`. Each blog change becomes a commit on `main`, which triggers the GitHub Pages workflow.

## Blog behavior

Blog posts are static Markdown content. The public blog uses a single `/blog/` route; clicking a post opens its article inside that same page using `?slug=...`. No `/blog/<slug>/` route is generated, avoiding the GitHub Pages refresh/404 problem.


### Projects management
Projects live in `src/content/projects/*.md`. Each project stores a title, short description, GitHub repository URL, and optional featured flag. The Admin panel now includes a **Projects** tab so you can add, edit, rename, feature, or delete projects directly from the browser; changes are committed to GitHub and GitHub Pages rebuilds the site automatically.
