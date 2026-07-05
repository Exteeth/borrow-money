const DISCORD_WEBHOOK_URL = "https://discordapp.com/api/webhooks/1523351990447640678/GUFYlYykDDNscMC1WX4xpoyb-nDSx6jGDqiEevK8qU-mhEwuausCAsPNlOBERmsRUMh5";

export async function sendDiscordNotification(
  createdBy: string,
  type: "borrow" | "lend",
  amount: number,
  description: string
) {
  try {
    const creatorName = createdBy.toLowerCase() === "num" ? "Num" : (createdBy.toLowerCase() === "kaew" ? "Kaew" : createdBy);
    const formattedAmount = amount.toLocaleString("th-TH");
    
    let title = "";
    let color = 0x000000;
    let descriptionText = "";

    if (type === "borrow") {
      if (creatorName === "Num") {
        title = "🔴 Num ได้บันทึกการยืมเงิน";
        descriptionText = `**Num** ยืมเงินจาก **Kaew** เป็นจำนวน **฿${formattedAmount}**`;
        color = 0xc87a68; // Muted terracotta red
      } else {
        title = "🟢 Kaew ได้บันทึกการคืนเงิน";
        descriptionText = `**Kaew** ได้รับเงินคืนจาก **Num** เป็นจำนวน **฿${formattedAmount}**`;
        color = 0x82ad8a; // Muted green
      }
    } else {
      // type === "lend"
      if (creatorName === "Kaew") {
        title = "🔴 Kaew ได้บันทึกการให้ยืมเงิน";
        descriptionText = `**Kaew** ให้ **Num** ยืมเงินเป็นจำนวน **฿${formattedAmount}**`;
        color = 0xc87a68; // Muted terracotta red
      } else {
        title = "🟢 Num ได้บันทึกการคืนเงิน";
        descriptionText = `**Num** ได้คืนเงินให้ **Kaew** เป็นจำนวน **฿${formattedAmount}**`;
        color = 0x82ad8a; // Muted green
      }
    }

    if (description.trim()) {
      descriptionText += `\n\n**บันทึกเพิ่มเติม:** ${description}`;
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
