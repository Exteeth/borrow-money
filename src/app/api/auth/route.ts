import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { pinSchema } from "@/lib/validators";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getDb() {
  const apps = getApps();
  if (apps.length && apps[0]) return getFirestore(apps[0]);
  return getFirestore(initializeApp(firebaseConfig));
}

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;
const lockoutMap = new Map<string, { count: number; lockedUntil: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json() as { profileId: string; pin: string };

    const result = pinSchema.safeParse(body.pin);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid PIN format" }, { status: 400 });
    }

    const { profileId, pin } = body;

    // Check lockout
    const lockout = lockoutMap.get(profileId);
    if (lockout) {
      const now = Date.now();
      if (now < lockout.lockedUntil) {
        const remaining = Math.ceil((lockout.lockedUntil - now) / 1000);
        return NextResponse.json(
          { error: `Too many attempts. Try again in ${remaining}s`, lockout: true },
          { status: 429 }
        );
      }
      lockoutMap.delete(profileId);
    }

    // Read profile from Firestore
    const db = getDb();
    const profileSnap = await getDoc(doc(db, "profiles", profileId));

    if (!profileSnap.exists()) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const profile = profileSnap.data();
    if (!profile?.pin) {
      return NextResponse.json({ error: "Profile data is invalid" }, { status: 500 });
    }

    const isValid = await bcrypt.compare(pin, profile.pin as string);

    if (!isValid) {
      const currentCount = (lockout?.count ?? 0) + 1;
      if (currentCount >= MAX_PIN_ATTEMPTS) {
        lockoutMap.set(profileId, {
          count: currentCount,
          lockedUntil: Date.now() + LOCKOUT_SECONDS * 1000,
        });
        return NextResponse.json(
          { error: `Locked out for ${LOCKOUT_SECONDS}s`, lockout: true },
          { status: 429 }
        );
      }
      lockoutMap.set(profileId, { count: currentCount, lockedUntil: 0 });
      return NextResponse.json(
        { error: "Incorrect PIN", remainingAttempts: MAX_PIN_ATTEMPTS - currentCount },
        { status: 401 }
      );
    }

    lockoutMap.delete(profileId);

    await setSessionCookie({
      uid: profileId,
      profileId,
      profileName: profile.name as string,
      deviceId: (profile.deviceId as string) ?? "unknown",
    });

    return NextResponse.json({
      success: true,
      profile: {
        id: profileId,
        name: profile.name,
        avatarType: profile.avatarType,
        color: profile.color,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Auth error:", message);
    return NextResponse.json(
      { error: `Server error: ${message}` },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Logout error:", message);
    return NextResponse.json({ error: `Server error: ${message}` }, { status: 500 });
  }
}