export default async function handler(req, res) {
  const { slug, source } = req.query;
const validSources = [
  "whatsapp",
  "instagram",
  "facebook",
  "tiktok",
  "x",
  "substack",
  "linkedin",
  "web",
  "direct"
];

const normalizedSource = String(source || "direct").toLowerCase();

const finalSource = validSources.includes(normalizedSource)
  ? normalizedSource
  : "direct";
  if (!slug) {
    return res.status(400).send("Falta el slug");
  }

  try {
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

const userAgent = req.headers["user-agent"] || "";

// LinkedIn realiza peticiones automáticas desde su aplicación/WebView.
// No contabilizarlas como clic.
const isLinkedInWebView =
  userAgent.toLowerCase().includes("linkedin/windows-native-app/edge-webview2") ||
  userAgent.toLowerCase().includes("[linkedinapp]");

if (isLinkedInWebView) {
  return res.redirect(302, link.destination_url);
}
const isWhatsAppPreview =
  userAgent.toLowerCase().includes("whatsapp");

if (isWhatsAppPreview) {
  return res.redirect(302, link.destination_url);
}
    const device = /Mobi|Android|iPhone|iPad/i.test(userAgent)
      ? "mobile"
      : "desktop";

    const country = req.headers["x-vercel-ip-country"] || null;

// Identificador aproximado de la visita
const visitorKey = [
  country || "unknown",
  device,
  finalSource,
  req.headers["user-agent"] || "unknown"
].join("|");

// Comprobar si ya existe un clic idéntico en los últimos 10 segundos
const recentResponse = await fetch(
  `${process.env.SUPABASE_URL}/rest/v1/clicks?link_id=eq.${link.id}&visitor_key=eq.${encodeURIComponent(visitorKey)}&created_at=gte.${encodeURIComponent(new Date(Date.now() - 10000).toISOString())}&select=id&limit=1`,
  {
    method: "GET",
    headers: {
      "apikey": process.env.SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`
    }
  }
);

const recentClicks = await recentResponse.json();

if (recentClicks.length > 0) {
  return res.redirect(302, link.destination_url);
}

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
  country: country,
  device: device,
  source: finalSource,
  visitor_key: visitorKey
})
      }
    );

    if (!clickResponse.ok) {
      const error = await clickResponse.text();

      console.error("Error registrando clic:", error);

      return res.status(500).json({
        error: "No se pudo registrar el clic",
        details: error
      });
    }

    return res.redirect(302, link.destination_url);

  } catch (error) {
    console.error("Error general:", error);

    return res.status(500).send(error.message);
  }
}
