# Kingdom Calibration Church Website

This project is now prepared for Phase 1 of the Firebase move.

## What Phase 1 does

- Adds `firebase.json` so the website files can be hosted on Firebase Hosting.
- Keeps the current website design and page content unchanged.
- Keeps the current Supabase database work unchanged.
- Keeps the current Netlify backend files in the project for now, because the forms and events API still need to be moved in Phase 2.

## Important church account note

When you connect Firebase, use the church Google account and the church Firebase project only.
Do not connect this folder to your personal Firebase account.

## What is ready right now

- `firebase.json` is ready for Firebase Hosting.
- `index.html`, `assets`, and `Photos` can be served from Firebase Hosting.
- Cache and security headers have been copied into the Firebase Hosting config.
- The project still includes:
  - `netlify/functions/contact.mts`
  - `netlify/functions/subscribe.mts`
  - `netlify/functions/events.mts`
  - `supabase/schema.sql`

## Important limitation right now

Do not switch the live website to Firebase yet.

Reason:
- The forms and upcoming events still depend on `/api/subscribe`, `/api/contact`, and `/api/events`.
- Those routes are still powered by Netlify functions at this stage.
- In Phase 2, we will move those backend routes to Firebase Functions so the whole site can run properly from Firebase.

## Phase 2 will do this

- Move the newsletter form backend to Firebase Functions
- Move the contact form backend to Firebase Functions
- Move the events API backend to Firebase Functions
- Keep Supabase as the database

## When you are ready to connect the church Firebase project

1. Open this folder in VS Code.
2. Make sure you are signed into the church Google account in your browser.
3. Install the Firebase CLI if it is not already installed.
4. In the terminal, run:

```bash
firebase login
```

5. In this project folder, run:

```bash
firebase use --add
```

6. Choose the church Firebase project, not your personal one.

After that, the folder will be linked to the church Firebase project.

## Local note

- If you double-click `index.html` and open it directly in the browser, forms and events will not work.
- They work only when the site is served through a real website address or a local web server.
