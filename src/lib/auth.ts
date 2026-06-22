import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export interface SessionData {
  uid: string; // Firebase Auth UID
  profileId: string; // profile document ID
  profileName: string;
  deviceId: string;
}

const SESSION_COOKIE = "mb_session";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function setSessionCookie(data: SessionData): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function getSessionCookie(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session) return null;

  try {
    return JSON.parse(session.value) as SessionData;
  } catch {
    return null;
  }
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function getSessionFromRequest(request: NextRequest): SessionData | null {
  const session = request.cookies.get(SESSION_COOKIE);
  if (!session) return null;

  try {
    return JSON.parse(session.value) as SessionData;
  } catch {
    return null;
  }
}