# Kingdom Calibration Church Website

This project is now prepared for Phase 2 of the Firebase move.

## What Phase 2 does

- Adds `firebase.json` so the website files can be hosted on Firebase Hosting.
- Adds Firebase Functions for:
  - newsletter signup
  - contact form submission
  - upcoming events loading
- Keeps the current website design and page content unchanged.
- Keeps Supabase as the database.
- Keeps the old Netlify backend files in the project only as a backup reference.

## Important church account note

When you connect Firebase, use the church Google account and the church Firebase project only.
Do not connect this folder to your personal Firebase account.

## What is ready right now

- `firebase.json` is ready for Firebase Hosting.
- `index.html`, `assets`, and `Photos` can be served from Firebase Hosting.
- Cache and security headers have been copied into the Firebase Hosting config.
- Firebase Hosting rewrites `/api/subscribe`, `/api/contact`, and `/api/events` to Firebase Functions.
- `functions/index.js` now contains the Firebase backend routes.
- `functions/.env.example` shows the non-secret Supabase URL value.
- `supabase/schema.sql` is still the database setup file.

## Important limitation right now

Do not point the live domain to Firebase until you finish the deploy steps below.

Reason:
- The forms and upcoming events still depend on `/api/subscribe`, `/api/contact`, and `/api/events`.
- The code is now ready for Firebase Functions, but the church Firebase project still needs to be linked and deployed.

## When you are ready to connect the church Firebase project

1. Open this folder in VS Code.
2. Make sure you are signed into the church Google account in your browser.
3. Make sure the church Firebase project is on the Blaze plan.
4. Install the Firebase CLI if it is not already installed.
5. Make sure Node.js is installed on your computer.
6. In the terminal, go into the project folder.
7. Run:

```bash
firebase login
```

8. In this project folder, run:

```bash
firebase use --add
```

9. Choose the church Firebase project, not your personal one.

10. Install the Firebase Functions package:

```bash
cd functions
npm install
```

11. Add the church Supabase URL for this Firebase project.
You can either:
- let Firebase prompt you during deploy, or
- create a local file named `functions/.env.YOUR_PROJECT_ID`

Inside that file, add:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
```

12. Set the secret key in the church Firebase project:

```bash
firebase functions:secrets:set SUPABASE_SERVICE_ROLE_KEY
```

13. Deploy the church website and backend:

```bash
firebase deploy --only functions,hosting
```

After that, the site should be able to run from the church Firebase project instead of Netlify.

## Firebase files to know

- `firebase.json` controls Hosting and rewrites
- `functions/index.js` contains the new backend routes
- `functions/package.json` defines the Firebase Functions runtime
- `functions/.env.example` shows the public Supabase URL format

## Church account reminder

When Firebase opens a login window or a project picker, always choose the church account and church project.
Do not accept your personal account by mistake.

## Local note

- If you double-click `index.html` and open it directly in the browser, forms and events will not work.
- They work only when the site is served through a real website address or a local web server.
- To fully test the new backend locally, use Firebase emulators after `npm install`.

## Old Netlify files

These are still in the project as reference only:

- `netlify/functions/contact.mts`
- `netlify/functions/subscribe.mts`
- `netlify/functions/events.mts`
- `netlify/functions/_shared/supabase.mts`

They are no longer the target architecture.
