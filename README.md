# The Hunt Log — Job Tracker

A private, Firebase-backed job hunt tracker. Log roles, contacts, outreach status, and notes — synced across any device you log into.

## What's inside

- React + Vite + Tailwind CSS
- Firebase Authentication (email/password)
- Firestore database (per-user data, secured by `firestore.rules`)
- Stage pipeline: Researching → Contacted → Replied → Interviewing → Offer → Closed

## 1. Local setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Firebase config is already wired in `src/firebase/config.js` to your `job-hunter-8e9a7` project.

## 2. Lock down your Firestore database

Your Firestore was created in **test mode**, which means right now anyone with your project ID could read/write data. Fix this before putting real data in:

1. Go to Firebase Console (console.firebase.google.com) → your project → Firestore Database → **Rules** tab
2. Replace the rules with the contents of `firestore.rules` in this repo
3. Click **Publish**

This restricts every entry so only the signed-in owner (matched by `uid`) can read or write it.

## 3. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: job tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/job-tracker.git
git push -u origin main
```

Replace `YOUR_USERNAME` and the repo name with your actual GitHub repo URL.

## 4. Deploy to GitHub Pages

If your repo name is NOT `job-tracker`, first edit `vite.config.js` and change the `base` value to match:

```js
base: '/your-repo-name/',
```

Then deploy:

```bash
npm run deploy
```

This builds the app and pushes the `dist/` folder to a `gh-pages` branch. Then in your GitHub repo:
1. Go to **Settings → Pages**
2. Under "Source," select branch `gh-pages`, folder `/ (root)`
3. Save — your app will be live at `https://YOUR_USERNAME.github.io/job-tracker/` within a minute or two

## 5. Authorize the domain in Firebase

Firebase blocks auth requests from unrecognized domains by default:

1. Firebase Console → Authentication → Settings → **Authorized domains**
2. Click "Add domain"
3. Add `YOUR_USERNAME.github.io`

## 6. First login

Visit your deployed URL, click "First time here? Create an account," and sign up with the email/password you want to use. That account becomes the only one that can see your data (per the security rules above).

## Notes

- All your job entries are private to your Firebase account — nobody else can read them, including via the public GitHub repo (the API key in the code is safe to expose; Firestore rules are the actual security boundary, not the key).
- To add more remote-type categories or pipeline stages later, edit `STAGES` and `REMOTE_TYPES` arrays at the top of `src/components/Dashboard.jsx`.
