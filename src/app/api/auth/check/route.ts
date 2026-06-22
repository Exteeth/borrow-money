import { NextResponse } from "next/server";
import { getSessionCookie } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ profile: null }, { status: 401 });
    }

    // Verify the profile still exists
    const db = getAdminDb();
    const profileDoc = await db
      .collection("profiles")
      .doc(session.profileId)
      .get();

    if (!profileDoc.exists) {
      return NextResponse.json({ profile: null }, { status: 401 });
    }

    const profileData = profileDoc.data();
    if (!profileData) {
      return NextResponse.json({ profile: null }, { status: 401 });
    }

    return NextResponse.json({
      profile: {
        id: session.profileId,
        name: profileData.name,
        avatarType: profileData.avatarType,
        color: profileData.color,
      },
    });
  } catch (error: unknown) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}