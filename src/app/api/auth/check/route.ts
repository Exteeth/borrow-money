import { NextResponse } from "next/server";
import { getSessionCookie } from "@/lib/auth";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ profile: null }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.profileId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ profile: null }, { status: 401 });
    }

    return NextResponse.json({
      profile: {
        id: session.profileId,
        name: profile.name,
        avatarType: profile.avatar_type,
        color: profile.color,
      },
    });
  } catch (error: unknown) {
    console.error("Session check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}