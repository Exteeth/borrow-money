import { NextResponse } from "next/server";
import { getSessionCookie } from "@/lib/auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { amountSchema, recordTypeSchema, descriptionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const session = await getSessionCookie();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      personName: string;
      amount: number;
      type: "borrow" | "lend";
      description?: string;
    };

    // Validate
    const amountResult = amountSchema.safeParse(body.amount);
    if (!amountResult.success) {
      return NextResponse.json({ error: amountResult.error.issues[0]?.message ?? "Invalid amount" }, { status: 400 });
    }

    const typeResult = recordTypeSchema.safeParse(body.type);
    if (!typeResult.success) {
      return NextResponse.json({ error: typeResult.error.issues[0]?.message ?? "Invalid type" }, { status: 400 });
    }

    const descResult = descriptionSchema.safeParse(body.description ?? "");
    if (!descResult.success) {
      return NextResponse.json({ error: descResult.error.issues[0]?.message ?? "Invalid description" }, { status: 400 });
    }

    if (!body.personName || body.personName.trim().length === 0) {
      return NextResponse.json({ error: "Person name is required" }, { status: 400 });
    }

    const db = getAdminDb();
    const recordRef = db.collection("records").doc();
    const txnRef = db.collection("transactions").doc();

    const record = {
      type: body.type,
      personName: body.personName.trim(),
      amount: body.amount,
      currentBalance: body.amount,
      description: body.description?.trim() ?? "",
      createdBy: session.profileId,
      createdAt: new Date(),
    };

    const transaction = {
      recordId: recordRef.id,
      action: "create",
      amount: body.amount,
      prevBalance: 0,
      newBalance: body.amount,
      editedBy: session.profileId,
      editedByName: session.profileName,
      note: body.description?.trim() ?? "",
      createdAt: new Date(),
    };

    // Write both in parallel
    await Promise.all([
      recordRef.set(record),
      txnRef.set(transaction),
    ]);

    return NextResponse.json({
      success: true,
      record: { id: recordRef.id, ...record },
    }, { status: 201 });
  } catch (error: unknown) {
    console.error("Create record error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}