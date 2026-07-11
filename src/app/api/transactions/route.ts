import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSessionCookie } from "@/lib/auth";

// GET /api/transactions — Fetch transactions (optionally filtered by recordId)
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get("recordId");

    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (recordId) {
      query = query.eq("record_id", recordId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ transactions: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
