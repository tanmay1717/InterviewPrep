# Interview Prep Tracker

A Chrome extension that:
- Auto-detects job application emails in Gmail and logs the company (heuristically - you review/confirm each one)
- Walks you through a 9-week DSA / LLD / HLD study plan with checklists and progress rings
- Sends a daily local notification with "today's focus"
- **Practice tab**: ~150 pattern-wise LeetCode problems (NeetCode 150 style) with search/filters, plus an 11-week System Design roadmap and classic HLD problems
- **Friends tab** (optional): sign in, sync your progress across machines, add friends by username and compare progress on a leaderboard
- Works fully offline/locally without signing in

## 1. Load the extension

1. Open `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select this folder
4. Note the **ID** shown under the extension's name - you'll need it in step 2

At this point the extension already works for **manual** application tracking, the study plan, and daily reminders. Gmail auto-detection needs one more setup step below.

## 2. Enable Gmail auto-detection (one-time Google Cloud setup)

Gmail auto-detection uses Google's official Gmail API through OAuth - meaning you grant your own extension permission to read your own inbox. Google does not issue OAuth credentials on your behalf, so you create your own (free):

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and create a new project (e.g. "Interview Prep Tracker")
2. Go to **APIs & Services > Library**, search for **Gmail API**, and click **Enable**
3. Go to **APIs & Services > OAuth consent screen**
   - User type: **External**
   - Add your own Gmail address as a **test user**
   - Add the scope `https://www.googleapis.com/auth/gmail.readonly`
4. Go to **APIs & Services > Credentials > Create Credentials > OAuth client ID**
   - Application type: **Chrome Extension**
   - Item ID: paste the extension ID you copied in step 1
5. Copy the generated **Client ID** (looks like `1234567890-abc...apps.googleusercontent.com`)
6. Open `manifest.json` in this folder and replace:
   ```json
   "client_id": "PASTE_YOUR_OAUTH_CLIENT_ID_HERE.apps.googleusercontent.com"
   ```
   with your real client ID
7. Go back to `chrome://extensions` and click the reload icon on this extension
8. Open the extension popup, go to the **Applications** tab, and click **Connect Gmail** - grant the permission when Chrome asks

Since the OAuth consent screen is in "Testing" mode with only you as a test user, Google will show an "unverified app" warning - this is expected for a personal-use tool. Click **Continue** to proceed.

## 3. How auto-detection works (and its limits)

Every few hours (configurable in **Settings**), the extension searches your inbox for emails from common applicant-tracking systems (Greenhouse, Lever, Workday, iCIMS, SmartRecruiters, Ashby, Jobvite, Taleo) and subject lines containing words like "application" or "applying." It then guesses the company name from the sender's domain or the subject line.

This is a heuristic, not a guarantee - some entries will have the wrong company name or none at all. That's why every auto-detected entry appears in the **Applications** tab tagged **"Auto-detected - review"** with **Confirm** / **Dismiss** buttons. Nothing is added to your tracked list silently; you always review it first. You can also edit the company/position/date inline at any time.

## 4. Daily reminders

Set a time in **Settings** (right-click the extension icon > Options). At that time each day, Chrome shows a notification with your focus for the day, based on the 9-week plan in `studyplan.js` and a simple weekly rotation (mostly DSA on weekdays, one LLD day, one HLD day, one mock/review day, one rest day).

Chrome needs to be running (it can be in the background/minimized) for the alarm to fire - it does not work if Chrome is fully closed.

## 5. Customizing the plan

Open `studyplan.js` and edit:
- `START_DATE` - when your 9-week program begins
- `STUDY_PLAN` - the week-by-week DSA/LLD/HLD/behavioral tasks
- `DAILY_FOCUS_ROTATION` - which track gets emphasized on which day
- `RESOURCES` - the links shown in the Resources tab

Reload the extension after editing.

## 6. Privacy & data

All data is stored locally via `chrome.storage.local` (or `localStorage` on the website). Without signing in, the only network calls are directly from your browser to `gmail.googleapis.com` using your own OAuth token.

If you sign in (section 7), your study-plan checklist, 90-day calendar, solved problems, system-design checklist, and any questions or resources you added are saved to your Neon database through your Vercel server. Only you and friends you've accepted can read them - the server checks your login token on every request. Your job applications are also saved to your account so they appear on every device, but in a separate private table that only you can read - friends never see the companies, the statuses, or even how many you have. Without signing in, applications stay on the device where you added them. Passwords are stored as salted scrypt hashes. To wipe local data, go to **Options > Reset > Clear all data**, or just remove the extension.

## 7. Hosting: website + login + friends (Vercel + Neon)

```
Browser / extension  -->  Vercel (website + api/*.js)  -->  Neon Postgres
```

The **website** (`web/`) is a full-page version built around the 90 Days DSA Calendar, plus the System Design roadmap, Friends, Applications and Resources. It has no Gmail auto-detection or daily reminders (those need the extension). The **extension** uses the same server, so progress and applications sync between both. Run it locally with `npm run dev` (http://localhost:3000).

### One-time setup (one person does this)

1. **Neon** - create a free project at [neon.com](https://neon.com). Click **Connect** and copy the connection string.
2. **Local config** - copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` = the Neon connection string
   - `JWT_SECRET` = a long random string: `openssl rand -base64 48`

   `.env` is git-ignored - never commit it or put it in `config.js`.
3. **Create the tables:**
   ```bash
   npm install
   npm run db:migrate
   ```
   (Or paste `db/schema.sql` into Neon Console > SQL Editor and click Run.)
4. **Deploy to Vercel:**
   ```bash
   npx vercel login
   npx vercel link                       # create a new project, accept defaults
   npx vercel env add DATABASE_URL production
   npx vercel env add JWT_SECRET production
   npx vercel --prod
   ```
   Vercel prints your URL, e.g. `https://interview-prep-tracker.vercel.app`. That's the website - open it on any device.
   (Alternatively push this folder to GitHub and import it at vercel.com/new; add the same two environment variables in Project Settings.)
5. **Point the extension at it** - in `config.js`:
   ```js
   const API_BASE_URL = "https://interview-prep-tracker.vercel.app";
   ```
   then reload the extension at `chrome://extensions`. If you use a custom domain instead of `*.vercel.app`, also add it to `host_permissions` in `manifest.json`.

### Using it with a friend

1. Send them the website URL (or this folder with your `config.js`, if they want the extension).
2. Each of you: **Friends** tab > **Create account** (pick a username).
3. One of you types the other's username > **Add friend**; the other clicks **Accept**. You'll see each other on the leaderboard and can **Compare** pattern by pattern.

**Sync behaviour:** progress is saved every time you check something and pulled when you open the app. The first sign-in on a new machine merges that machine's progress with your account; after that the most recent change wins. Applications sync the same way, privately to your account (applications found by Gmail auto-detection sync the next time you open the popup). If someone else signs in on a device, they start with their own data - nothing from the previous account carries over.

**Project layout:** extension files live in the root (load this folder unpacked as before). `api/` and `lib/` are the Vercel server functions, `db/schema.sql` is the database, `web/` is the website UI, `core.js` holds the stats/sync logic shared by the popup and the website, `calendar.js` is the 90-day plan, and `scripts/build-web.mjs` builds the site into `public/` on each deploy. When zipping the extension for the Chrome Web Store, leave out `api/`, `lib/`, `db/`, `scripts/`, `web/`, `node_modules/` and `.env`.
# InterviewPrep
