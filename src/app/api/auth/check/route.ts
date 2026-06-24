import { NextResponse } from "next/server";
import { getSessionCookie } from "@/lib/auth";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getDb() {
  const app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  return getFirestore(app);
}

export async function GET() {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ profile: null }, { status: 401 });
    }

    const db = getDb();
    const profileSnap = await getDoc(doc(db, "profiles", session.profileId));

    if (!profileSnap.exists()) {
      return NextResponse.json({ profile: null }, { status: 401 });
    }

    const data = profileSnap.data();
    if (!data) {
      return NextResponse.json({ profile: null }, { status: 401 });
    }

    return NextResponse.json({
      profile: {
        id: session.profileId,
        name: data.name,
        avatarType: data.avatarType,
        color: data.color,
      },
    });
  } catch (error: unknown) {
    console.error("Session check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}