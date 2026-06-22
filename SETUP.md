# Firebase Setup Guide — Money Borrow

This project uses Firebase for authentication, database (Firestore), and server-side operations. Follow these 8 steps to get it running.

---

## Step 1: Create a Firebase Project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com/)** and sign in
2. Click **"Add project"**
3. Name: **`money-borrow`** → disable Google Analytics → **Create**
4. Click **Continue** when done

---

## Step 2: Enable Firestore Database

1. Left sidebar → **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** (we'll lock it later)
4. Location: **`asia-southeast1`** (Singapore) — closest to Thailand
5. Click **Enable**

---

## Step 3: Enable Anonymous Authentication

1. Left sidebar → **Build → Authentication** → **Get started**
2. Click the **"Anonymous"** provider card
3. Toggle it **ON** → **Save**

---

## Step 4: Get Your Firebase Config (Client Keys)

1. ⚙️ **Project settings** (gear icon) → scroll to "Your apps"
2. Click **`</>`** (web icon) to add a web app
3. Nickname: **`Money Borrow`** → **Register app**
4. Copy the `firebaseConfig` values into `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXX-XXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=money-borrow-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=money-borrow-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=money-borrow-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxxxxxxxx
```

---

## Step 5: Generate Admin SDK Private Key (Server Keys)

1. ⚙️ **Project settings → Service accounts** tab
2. Click **"Generate new private key"** → **"Generate key"**
3. A `.json` file downloads. Open it and fill:

```env
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@money-borrow-xxxxx.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvAIB...\n-----END PRIVATE KEY-----\n"
```

> ⚠️ Replace newlines in the key with `\n`. The code in `src/lib/firebase-admin.ts` handles this automatically.
> ⚠️ Never commit `.env.local` to git (it's already in `.gitignore`).

---

## Step 6: Deploy Firestore Security Rules

```bash
npx firebase-tools deploy --only firestore:rules
```

Or manually: Firebase Console → Firestore → Rules tab → paste contents of `firestore.rules` → Publish.

---

## Step 7: Create Profiles (Num & Kaew)

Once `.env.local` has real Firebase keys, run:

```bash
npm run setup-profiles
```

This creates Num (PIN: `123456`) and Kaew (PIN: `654321`) in Firestore.

> Default PINs can be changed after logging in.

---

## Step 8: Start & Verify

```bash
npm run dev
```

1. Open **http://localhost:3000/login**
2. You'll see Num & Kaew profile cards
3. Tap a profile → enter their 6-digit PIN
4. Redirected to the dashboard

---

## What Each Firebase Service Does

| Service            | Purpose                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| **Firestore**      | Stores profiles, money records, transaction audit logs — real-time sync |
| **Authentication** | Anonymous sign-in per device for Firestore security rules               |
| **Admin SDK**      | Server-side API routes read/write Firestore securely                    |

---

## Troubleshooting

| Problem                              | Fix                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| "Missing Firebase Admin credentials" | Check `FIREBASE_ADMIN_CLIENT_EMAIL` and `FIREBASE_ADMIN_PRIVATE_KEY` in `.env.local` |
| "Firestore: PERMISSION_DENIED"       | Deploy `firestore.rules` (Step 6)                                                    |
| Login doesn't work                   | Run `npm run setup-profiles` to create the profiles                                  |
| Module not found: firebase-admin     | Run `npm install`                                                                    |
