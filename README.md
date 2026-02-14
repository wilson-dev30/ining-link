# Valentine Dashboard

A small Valentine's Day page: login → “Will you be my Valentine?” → gift wishlist.  
The wishlist can sync in **real time** between you and your partner using Firebase.

---

## Deploy to GitHub (share the link)

1. Create a new repo on GitHub (e.g. `jessica-valentine`).
2. Push this folder to it.
3. **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main` (or `master`) → folder: **/ (root)** → Save.
4. Your page will be at: `https://<your-username>.github.io/<repo-name>/`

Share that URL with your partner. The first time someone opens it, the URL gets a `?list=...` id. **Use that full URL** (with `?list=...`) when you share. Both of you use the same link so you see the same wishlist.

---

## Real-time wishlist (see her list and updates)

To see the wishlist in real time on your side (and when she adds/removes items), set up Firebase once:

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com/).
2. **Add project** → name it (e.g. “Valentine”) → continue (Analytics optional).
3. When the project is ready, click **</> (Web)** to add an app.
4. Register app (e.g. “valentine-web”) → **Copy** the `firebaseConfig` object.

### 2. Enable Firestore

1. In the left menu: **Build → Firestore Database**.
2. **Create database** → Start in **test mode** (for quick setup) → choose a region → Enable.
3. Open **Rules** and replace with:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /wishlists/{listId}/items/{itemId} {
      allow read, write: if true;
    }
  }
}
```

This allows read/write only to the wishlist items. The `listId` is in the URL, so only people with the link can see that list.

### 3. Add your config in the repo

1. Open **firebase-config.js** in this project.
2. Replace the placeholder values with the ones from your Firebase app:

- `apiKey`
- `authDomain`
- `projectId`
- `storageBucket`
- `messagingSenderId`
- `appId`

3. Save, commit, and push to GitHub. After the next deploy, the wishlist will sync in real time for anyone using the same link (with the same `?list=...`).

---

## Without Firebase

If you don’t set up Firebase, the app still works. The wishlist is stored only in the browser (localStorage) for whoever is using that device. There’s no sync between you and your partner until you add the config above.
