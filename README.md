# Kingdom Calibration Church Website

This folder is now prepared for:

- GitHub source control
- Netlify hosting
- Supabase storage for forms and events

## What is already set up

- `netlify.toml` tells Netlify to publish this folder as a static website and to use the `netlify/functions` folder for backend form handling.
- The newsletter form and contact form in `index.html` now send data to Netlify API routes instead of showing browser-only popups.
- `netlify/functions/contact.mts` stores contact messages in Supabase.
- `netlify/functions/events.mts` reads upcoming events from Supabase.
- `netlify/functions/subscribe.mts` stores newsletter signups in Supabase.
- The homepage, About, Ministries, Visit, and Sermons sections all live in `index.html`.
- The website domain is now `https://kingdomcalibrationchurch.org/`.
- `supabase/schema.sql` gives you the database tables you need.
- `.gitignore` keeps local and secret files out of GitHub.
- `.env.example` shows which secret values belong in Netlify.

## How we are working on the site now

- We now make changes locally first.
- We only push to GitHub and let Netlify deploy when a bigger batch is ready.
- This helps reduce unnecessary deploys and avoids using up credits on tiny edits.

## Main connected services

1. GitHub stores the site code.
2. Netlify hosts the live website and runs the backend functions.
3. Supabase stores newsletter signups, contact form messages, and events.

## How to manage events without touching code

1. In Supabase, run `supabase/schema.sql` so the new `events` table is created.
2. Open the Supabase Table Editor and choose the `events` table.
3. Add or edit events there instead of changing `index.html`.
4. Set `start_at` and `end_at` so the website knows when an event begins and when it should disappear automatically.
5. If an event has a poster, upload it to the `event-posters` storage bucket in Supabase and paste the public image URL into `poster_url`.
6. Leave `is_published` turned on for events you want shown on the website.

The website will only show events whose end time has not passed yet. If there are no upcoming events, the page will show a friendly message instead of an empty space.

## Sermons

- The site now has a sermons page inside `index.html`.
- Sermons are designed to be organized in series.
- Video content should stay on YouTube so the site does not use storage for sermon files.

## Important note about secrets

- `SUPABASE_SERVICE_ROLE_KEY` must stay inside Netlify environment variables only.
- Do not paste that key into `index.html`, GitHub, or any public file.


## Local testing

- If you double-click `index.html` and open it directly in the browser, the forms will not send data.
- If you want local Netlify testing on your computer, install Node.js first, then install the Netlify CLI.
- For local form testing, use Netlify local dev:

```bash
netlify dev
```

## Suggested Git commands

If you want, you can use these commands inside this folder:

```bash
git add .
git commit -m "Prepare site for Netlify and Supabase"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```
