import { NextResponse } from "next/server";
import { getSessionCookie } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { amountSchema, descriptionSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json() as {
      amount?: number;
      description?: string;
    };

    const db = getAdminDb();
    const recordRef = db.collection("records").doc(id);
    const recordDoc = await recordRef.get();

    if (!recordDoc.exists) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const record = recordDoc.data();
    if (!record) {
      return NextResponse.json({ error: "Record data invalid" }, { status: 500 });
    }

    const updates: Record<string, unknown> = {};
    let auditAmount = 0;
    let prevBalance = record.currentBalance as number;
    let newBalance = prevBalance;

    if (body.amount !== undefined) {
      const amountResult = amountSchema.safeParse(body.amount);
      if (!amountResult.success) {
        return NextResponse.json(
          { error: amountResult.error.issues[0]?.message ?? "Invalid amount" },
          { status: 400 }
        );
      }
      const oldAmount = record.amount as number;
      const diff = body.amount - oldAmount;
      newBalance = prevBalance + diff;
      if (newBalance < 0) newBalance = 0;
      updates.amount = body.amount;
      updates.currentBalance = newBalance;
      auditAmount = body.amount;
    }

    if (body.description !== undefined) {
      const descResult = descriptionSchema.safeParse(body.description);
      if (!descResult.success) {
        return NextResponse.json(
          { error: descResult.error.issues[0]?.message ?? "Invalid description" },
          { status: 400 }
        );
      }
      updates.description = body.description;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    // Write audit log
    const txnRef = db.collection("transactions").doc();
    const transaction = {
      recordId: id,
      action: "edit",
      amount: auditAmount || (record.amount as number),
      prevBalance,
      newBalance,
      editedBy: session.profileId,
      editedByName: session.profileName,
      note: body.description?.trim() ?? (record.description as string) ?? "",
      createdAt: new Date(),
    };

    await Promise.all([
      recordRef.update(updates),
      txnRef.set(transaction),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Edit record error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}