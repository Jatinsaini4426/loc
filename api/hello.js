export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const resp = await fetch(
      `https://api.telegram.org/bot6235375573:AAHdripMzwMYFL0dhruXGyvmJ6ZSQhWCTn4/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: 1444862345,
          text: message,
        }),
      }
    );

    const data = await resp.json();
    if (!data.ok) throw new Error(data.description);

    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
