import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSessionCookie } from "@/lib/auth";

// GET /api/records — Fetch all records
export async function GET() {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("records")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ records: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/records — Create a new record + transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      type: "borrow" | "lend";
      personName: string;
      amount: number;
      description: string;
      createdBy: string;
      createdByName: string;
    };

    const supabase = getSupabaseAdmin();

    // Insert record
    const { data: insertedRecord, error: recordError } = await supabase
      .from("records")
      .insert({
        type: body.type,
        person_name: body.personName,
        amount: body.amount,
        current_balance: body.amount,
        description: body.description,
        created_by: body.createdBy,
      })
      .select()
      .single();

    if (recordError || !insertedRecord) {
      throw recordError || new Error("Insert failed");
    }

    // Insert audit transaction
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        record_id: insertedRecord.id,
        action: "create",
        amount: body.amount,
        prev_balance: 0,
        new_balance: body.amount,
        edited_by: body.createdBy,
        edited_by_name: body.createdByName,
        note: body.description,
      });

    if (txError) throw txError;

    return NextResponse.json({ success: true, record: insertedRecord });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Create record error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
