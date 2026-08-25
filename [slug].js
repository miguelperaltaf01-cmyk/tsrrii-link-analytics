export default async function handler(req, res) {
  const { slug, source } = req.query;
  console.log("CLICK REQUEST:", {
    slug,
    source,
    method: req.method,
    userAgent: req.headers["user-agent"],
    referer: req.headers.referer || req.headers.referrer || "none",
    timestamp: new Date().toISOString()
  });
  if (!slug) {
    return res.status(400).send("Falta el slug");
  }

  try {
    // Buscar el enlace en Supabase
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/links?slug=eq.${encodeURIComponent(slug)}&select=id,slug,destination_url`,
      {
        method: "GET",
        headers: {
          "apikey": process.env.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).send(error);
    }

    const links = await response.json();

    if (!links.length) {
      return res.status(404).send("Enlace no encontrado");
    }

    const link = links[0];

    // Detectar dispositivo
    const userAgent = req.headers["user-agent"] || "";

    const device = /Mobi|Android|iPhone|iPad/i.test(userAgent)
      ? "mobile"
      : "desktop";

    // Registrar clic
    await fetch(
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
          link_id: link.id,
          device: device,
          source: source || "direct"
        })
      }
    );

    // Redirigir
    return res.redirect(302, link.destination_url);

  } catch (error) {
    return res.status(500).send(error.message);
  }
}
