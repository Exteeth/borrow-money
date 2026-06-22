// scripts/setup-profiles.ts
// One-time script to create Num & Kaew profiles in Firestore.
// Run with: npx tsx scripts/setup-profiles.ts
// Requires .env.local with real Firebase Admin credentials.

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import bcrypt from "bcryptjs";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
  /\\n/g,
  "\n"
);

if (!projectId || !clientEmail || !privateKey) {
  console.error(
    "❌ Missing Firebase Admin credentials in environment variables."
  );
  console.error("   Make sure .env.local has:");
  console.error("   - NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  console.error("   - FIREBASE_ADMIN_CLIENT_EMAIL");
  console.error("   - FIREBASE_ADMIN_PRIVATE_KEY");
  process.exit(1);
}

// Initialize Admin SDK
const app = initializeApp({
  credential: cert({ projectId, clientEmail, privateKey }),
});
const db = getFirestore(app);

async function setup() {
  console.log("🚀 Setting up Money Borrow profiles...\n");

  const profiles = db.collection("profiles");

  // Check if profiles already exist
  const numDoc = await profiles.doc("num").get();
  const kaewDoc = await profiles.doc("kaew").get();

  if (numDoc.exists) {
    console.log("⚠️  Num's profile already exists — skipping.");
  } else {
    const numPin = await bcrypt.hash("123456", 10);
    await profiles.doc("num").set({
      name: "Num",
      pin: numPin,
      avatarType: "male",
      color: "#6c5ce7",
      deviceId: "num-device-001",
      createdAt: new Date(),
    });
    console.log("✅ Num profile created (PIN: 123456)");
  }

  if (kaewDoc.exists) {
    console.log("⚠️  Kaew's profile already exists — skipping.");
  } else {
    const kaewPin = await bcrypt.hash("654321", 10);
    await profiles.doc("kaew").set({
      name: "Kaew",
      pin: kaewPin,
      avatarType: "female",
      color: "#e84393",
      deviceId: "kaew-device-001",
      createdAt: new Date(),
    });
    console.log("✅ Kaew profile created (PIN: 654321)");
  }

  console.log("\n🎉 Setup complete! Run `npm run dev` and go to /login");
  console.log("   Num  → PIN: 123456");
  console.log("   Kaew → PIN: 654321");
}

setup().catch((err) => {
  console.error("❌ Setup failed:", err.message);
  process.exit(1);
});