import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSessionCookie } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/records/[id] — Update a record + log transaction
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: recordId } = await params;
    const body = await request.json() as {
      action: "edit" | "decrease" | "payback";
      amount?: number;
      currentBalance?: number;
      newBalance: number;
      prevBalance: number;
      description?: string;
      editedBy: string;
      editedByName: string;
      note: string;
    };

    const supabase = getSupabaseAdmin();

    // Build update object
    const updateData: Record<string, unknown> = {
      current_balance: body.newBalance,
    };
    if (body.action === "edit" && body.amount !== undefined) {
      updateData.amount = body.amount;
    }
    if (body.description !== undefined) {
      updateData.description = body.description;
    }

    const { error: updateError } = await supabase
      .from("records")
      .update(updateData)
      .eq("id", recordId);

    if (updateError) throw updateError;

    // Write audit transaction
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        record_id: recordId,
        action: body.action === "payback" ? "decrease" : body.action,
        amount: body.amount ?? Math.abs(body.prevBalance - body.newBalance),
        prev_balance: body.prevBalance,
        new_balance: body.newBalance,
        edited_by: body.editedBy,
        edited_by_name: body.editedByName,
        note: body.note,
      });

    if (txError) throw txError;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Update record error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/records/[id] — Delete a record
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: recordId } = await params;
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("records")
      .delete()
      .eq("id", recordId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Delete record error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
