import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  setSessionCookie,
  clearSessionCookie,
} from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { pinSchema } from "@/lib/validators";

const MAX_PIN_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

// In-memory lockout store (cleared on server restart; Firestore-based in production)
const lockoutMap = new Map<string, { count: number; lockedUntil: number }>();

export async function POST(request: Request) {
  try {
    const body = await request.json() as { profileId: string; pin: string };

    // Validate PIN format
    const result = pinSchema.safeParse(body.pin);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid PIN format" },
        { status: 400 }
      );
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
      // Lockout expired → reset
      lockoutMap.delete(profileId);
    }

    // Fetch profile from Firestore via Admin SDK
    const db = getAdminDb();
    const profileDoc = await db.collection("profiles").doc(profileId).get();

    if (!profileDoc.exists) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const profile = profileDoc.data();

    if (!profile) {
      return NextResponse.json(
        { error: "Profile data is invalid" },
        { status: 500 }
      );
    }

    // Compare PIN
    const isValid = await bcrypt.compare(pin, profile.pin);

    if (!isValid) {
      // Track failed attempt
      const currentCount = (lockout?.count ?? 0) + 1;
      if (currentCount >= MAX_PIN_ATTEMPTS) {
        lockoutMap.set(profileId, {
          count: currentCount,
          lockedUntil: Date.now() + LOCKOUT_SECONDS * 1000,
        });
        return NextResponse.json(
          {
            error: `Locked out for ${LOCKOUT_SECONDS}s after ${MAX_PIN_ATTEMPTS} failed attempts`,
            lockout: true,
          },
          { status: 429 }
        );
      }
      lockoutMap.set(profileId, {
        count: currentCount,
        lockedUntil: 0,
      });
      return NextResponse.json(
        { error: "Incorrect PIN", remainingAttempts: MAX_PIN_ATTEMPTS - currentCount },
        { status: 401 }
      );
    }

    // Success — clear lockout
    lockoutMap.delete(profileId);

    // Set session cookie
    await setSessionCookie({
      uid: profileId,
      profileId,
      profileName: profile.name,
      deviceId: profile.deviceId ?? "unknown",
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
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}