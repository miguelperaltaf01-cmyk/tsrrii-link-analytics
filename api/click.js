export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { link_id, country, device, source } = req.body;

    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/clicks`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          link_id,
          country,
          device,
          source
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
