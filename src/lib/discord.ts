import { parseCategoryNote, isPaybackRecord } from "@/lib/categories";

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function sendDiscordNotification(
  createdBy: string,
  type: "borrow" | "lend",
  amount: number,
  description: string
) {
  try {
    if (!DISCORD_WEBHOOK_URL) {
      console.warn("DISCORD_WEBHOOK_URL is not set in environment variables.");
      return;
    }

    const creatorName = createdBy.toLowerCase() === "num" ? "Num" : (createdBy.toLowerCase() === "kaew" ? "Kaew" : createdBy);
    const formattedAmount = amount.toLocaleString("th-TH");
    const { category, cleanNote } = parseCategoryNote(description);
    const isPayback = isPaybackRecord(description, type, createdBy);
    
    let title = "";
    let color = 0x000000;
    let descriptionText = "";

    if (isPayback) {
      color = 0x10b981; // Luxury Emerald Green
      if (creatorName === "Num") {
        title = "💸 Num ได้บันทึกการคืนเงิน";
        descriptionText = `**Num** ได้คืนเงินให้ **Kaew** เป็นจำนวน **฿${formattedAmount}**`;
      } else {
        title = "💸 Kaew ได้บันทึกการรับเงินคืน";
        descriptionText = `**Kaew** ได้รับเงินคืนจาก **Num** เป็นจำนวน **฿${formattedAmount}**`;
      }
    } else {
      color = 0xc87a68; // Terracotta / warm debt tone
      if (creatorName === "Num") {
        title = "🔴 Num ได้บันทึกการยืมเงิน / แฟนจ่ายให้";
        descriptionText = `**Num** ยืมเงินจาก **Kaew** เป็นจำนวน **฿${formattedAmount}**`;
      } else {
        title = "🔴 Kaew ได้บันทึกการจ่ายให้ / ให้ Num ยืม";
        descriptionText = `**Kaew** ให้ **Num** ยืมเงินเป็นจำนวน **฿${formattedAmount}**`;
      }
    }

    if (category.id !== "other") {
      descriptionText += `\n**หมวดหมู่:** ${category.emoji} ${category.name}`;
    }

    if (cleanNote) {
      descriptionText += `\n**บันทึกเพิ่มเติม:** ${cleanNote}`;
    }

    const payload = {
      embeds: [
        {
          title,
          description: descriptionText,
          color,
          timestamp: new Date().toISOString(),
          footer: {
            text: "Money Borrow Premium Notification",
          },
        },
      ],
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Failed to send Discord notification:", error);
  }
}
