export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).send("Falta el slug");
  }

  try {
    // 1. Buscar el enlace por slug
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

    // 2. Detectar dispositivo
    const userAgent = req.headers["user-agent"] || "";

    const device = /Mobi|Android|iPhone|iPad/i.test(userAgent)
      ? "mobile"
      : "desktop";

    // 3. Registrar el clic en Supabase
    const clickResponse = await fetch(
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
          source: "direct"
        })
      }
    );

    // 4. Si Supabase rechaza el registro, mostrar el error
    if (!clickResponse.ok) {
      const error = await clickResponse.text();

      console.error("Error registrando clic:", error);

      return res.status(500).json({
        error: "No se pudo registrar el clic",
        details: error
      });
    }

    // 5. Redirigir al destino
    return res.redirect(302, link.destination_url);

  } catch (error) {
    console.error("Error general:", error);

    return res.status(500).send(error.message);
  }
}
