# Money Borrow — Project Context for AI Assistants

This is a **borrow/lend money tracking PWA** for two people (Num & Kaew).  
Built with Next.js 16, Firebase Firestore (client SDK only), and vanilla CSS.

## Stack

| Layer      | Tech                                                 |
| ---------- | ---------------------------------------------------- |
| Framework  | Next.js 16.2 (App Router, Turbopack)                 |
| Language   | TypeScript 5 (strict mode)                           |
| Database   | Firebase Firestore (client SDK v12)                  |
| Auth       | Firebase Anonymous Auth + httpOnly cookie sessions   |
| Styling    | Vanilla CSS (glassmorphism, CSS custom properties)   |
| Icons      | Inline SVGs (no icon library needed)                 |
| Fonts      | Inter (latin) + Prompt (thai) via `next/font/google` |
| Deployment | Vercel Hobby                                         |
| PWA        | Service worker via `/sw` API route + manifest        |

## How to Run

```bash
npm run dev      # development server at localhost:3000
npm run build    # production build
vercel --prod    # deploy
```

## Environment Variables (.env.local)

Only 6 `NEXT_PUBLIC_*` keys needed. No Admin SDK, no private keys.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout: fonts, metadata, ServiceWorkerRegister
│   ├── globals.css             # All design tokens + component styles
│   ├── manifest.ts             # PWA manifest
│   ├── (main)/                 # Auth-protected route group
│   │   ├── layout.tsx          # AuthProvider + ToastProvider + BottomNav
│   │   ├── page.tsx            # Dashboard: balance circle, add form, records list
│   │   ├── profile/page.tsx    # Profile stats, logout
│   │   ├── transactions/page.tsx  # Audit trail with filters
│   │   └── records/
│   │       ├── page.tsx        # All records list
│   │       ├── new/page.tsx    # Add record form
│   │       └── [id]/
│   │           ├── edit/page.tsx   # Edit record
│   │           └── decrease/page.tsx # Paid back flow
│   ├── login/page.tsx          # Profile select + PIN keypad
│   ├── api/
│   │   └── auth/
│   │       ├── route.ts        # POST login (bcrypt + session cookie), DELETE logout
│   │       └── check/route.ts  # GET session verification
│   └── sw/route.ts             # Service worker JS
├── components/
│   ├── BalanceCircle.tsx       # Animated balance display
│   ├── BillCompressor.tsx      # Canvas image compression to Base64
│   ├── BottomNav.tsx           # 3-item bottom navigation
│   ├── MoneyForm.tsx           # Reusable borrow/lend form
│   ├── PinKeypad.tsx           # 6-digit PIN entry keypad
│   ├── QuickActions.tsx        # Add / Paid Back buttons
│   └── ServiceWorkerRegister.tsx
├── context/
│   ├── AuthContext.tsx          # Auth state, login/logout, session check
│   └── ToastContext.tsx         # Toast notification system
├── hooks/
│   ├── useAuth.ts              # Auth hook re-export
│   ├── useRecords.ts           # Real-time Firestore records listener
│   └── useTransactions.ts      # Real-time Firestore transactions listener
├── lib/
│   ├── auth.ts                 # Session cookie helpers (httpOnly, secure, sameSite)
│   ├── firebase.ts             # Client Firebase SDK init
│   ├── utils.ts                # formatBaht, formatRelativeTime, generateDeviceId
│   └── validators.ts           # Zod v4 schemas for input validation
└── proxy.ts                    # Route protection (redirects to /login)

firestore.rules                 # Firestore security rules
firebase.json                   # Firebase deploy config
```

## Auth Flow

1. User visits any page → proxy.ts redirects to `/login`
2. Login page shows Num & Kaew profile cards
3. User taps a profile → 6-digit PIN keypad appears
4. On PIN entry → POST `/api/auth` → server reads profile from Firestore → bcrypt.compare → sets httpOnly cookie → returns profile
5. Browser runs `signInAnonymously()` for Firestore read access
6. Protected routes now accessible

## Data Model (Firestore)

```
profiles/{profileId}     # num, kaew
  name, pin (bcrypt), avatarType (male|female), color, deviceId, createdAt

records/{id}             # borrow/lend entries
  type (borrow|lend), personName, amount, currentBalance, description,
  billImageBase64?, createdBy, createdAt

transactions/{id}        # Audit log
  recordId, action (create|edit|decrease), amount, prevBalance, newBalance,
  editedBy, editedByName, note, createdAt
```

## Key Design Decisions

- **No Firebase Admin SDK**: All writes use client SDK directly. Server routes only handle PIN verification + cookie management.
- **Profiles public read**: PINs are bcrypt-hashed, so reading profiles is safe.
- **Name auto-detected**: Since there are only 2 users, the app knows the other person's name automatically.
- **All CSS in globals.css**: No CSS modules per file. One file with design tokens + component styles.
- **Glassmorphism**: Frosted glass UI via `backdrop-filter: blur()` + semi-transparent backgrounds.

## Common Tasks

- **Fix build**: `npm run build` — must pass with 0 TypeScript errors
- **Add a page**: Create file in `src/app/(main)/` (protected) or `src/app/` (public)
- **Add a component**: Create in `src/components/`, import in the page
- **Add styles**: Edit `src/app/globals.css`
- **Firestore rules**: Edit `firestore.rules`, deploy via Firebase Console or `npx firebase-tools deploy`
- **Deploy**: `vercel --prod`
