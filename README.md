# Web App

## Purpose

This app provides current-season analysis, Excel export, and track lookup
without using the Discord bot at runtime.

## Local Data Refresh

1. Parse or update the latest season into SQLite:
   `python3 parse.py --pdf ./pdfs/2026s3.pdf --season "2026 Season 3" --verbose`
2. Export prepared artifacts:
   `python3 export_web_data.py --db ./db/iracing.db --out ./web/data`

## Local Development

```bash
cd web
npm install
npm run test
npm run lint
npm run build
npm run dev
```

## Deployment

- Root Directory: `web`
- Install Command: `npm install`
- Build Command: `npm run build`
- No Python or SQLite runtime is required on Vercel.
