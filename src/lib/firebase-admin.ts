import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let app: App;
let db: Firestore;
let auth: Auth;

function getAdminApp(): App {
  if (!getApps().length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    if (privateKey) {
      if (
        (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
        (privateKey.startsWith("'") && privateKey.endsWith("'"))
      ) {
        privateKey = privateKey.slice(1, -1);
      }
      privateKey = privateKey.replace(/\\n/g, "\n");
    }

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Missing Firebase Admin credentials. Check FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in .env.local"
      );
    }

    app = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }
  const apps = getApps();
  if (!apps[0]) {
    throw new Error("Firebase Admin failed to initialize");
  }
  return apps[0];
}

export function getAdminDb(): Firestore {
  if (!db) {
    app = getAdminApp();
    db = getFirestore(app);
  }
  return db;
}

export function getAdminAuth(): Auth {
  if (!auth) {
    app = getAdminApp();
    auth = getAuth(app);
  }
  return auth;
}