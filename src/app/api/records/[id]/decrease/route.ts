import { NextResponse } from "next/server";
import { getSessionCookie } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { amountSchema } from "@/lib/validators";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json() as { amount: number };

    const amountResult = amountSchema.safeParse(body.amount);
    if (!amountResult.success) {
      return NextResponse.json(
        { error: amountResult.error.issues[0]?.message ?? "Invalid amount" },
        { status: 400 }
      );
    }

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

    const currentBalance = record.currentBalance as number;

    if (body.amount > currentBalance) {
      return NextResponse.json(
        { error: "Payment amount exceeds current balance" },
        { status: 400 }
      );
    }

    const newBalance = currentBalance - body.amount;

    // Write audit log
    const txnRef = db.collection("transactions").doc();
    const transaction = {
      recordId: id,
      action: "decrease",
      amount: body.amount,
      prevBalance: currentBalance,
      newBalance,
      editedBy: session.profileId,
      editedByName: session.profileName,
      note: `Paid back ฿${body.amount.toLocaleString("th-TH")}`,
      createdAt: new Date(),
    };

    await Promise.all([
      recordRef.update({ currentBalance: newBalance }),
      txnRef.set(transaction),
    ]);

    return NextResponse.json({ success: true, newBalance });
  } catch (error: unknown) {
    console.error("Decrease record error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}