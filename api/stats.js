export default async function handler(req, res) {
  try {
    const { period = "all" } = req.query;
    // Obtener clics
    const clicksResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/clicks?select=id,created_at,link_id,country,device,source`,
      {
        method: "GET",
        headers: {
          "apikey": process.env.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!clicksResponse.ok) {
      const error = await clicksResponse.text();
      return res.status(clicksResponse.status).send(error);
    }

    const clicks = await clicksResponse.json();
let filteredClicks = clicks;

if (period !== "all") {
  const days = period === "today" ? 1 : period === "7" ? 7 : 30;

  const now = new Date();

  const mexicoDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);

  const startDate = new Date(`${mexicoDate}T00:00:00-06:00`);

  startDate.setDate(startDate.getDate() - (days - 1));

  filteredClicks = clicks.filter(click => {
    if (!click.created_at) return false;

    const clickDate = new Date(click.created_at);

    return clickDate >= startDate;
  });
}
    // Obtener enlaces
    const linksResponse = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/links?select=id,name,slug`,
      {
        method: "GET",
        headers: {
          "apikey": process.env.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!linksResponse.ok) {
      const error = await linksResponse.text();
      return res.status(linksResponse.status).send(error);
    }

    const links = await linksResponse.json();

    // Crear mapa de enlaces
    const linkMap = {};

    links.forEach((link) => {
      linkMap[link.id] = {
        name: link.name,
        slug: link.slug
      };
    });

    const totalClicks = filteredClicks.length;

    const bySource = {};
    const byCountry = {};
    const byDevice = {};
    const byLink = {};
    const byDay = {};
links.forEach((link) => {
  byLink[link.id] = {
    id: link.id,
    name: link.name,
    slug: link.slug,
    clicks: 0,
    sources: {}
  };
});
    filteredClicks.forEach((click) => {
      const source = click.source || "direct";
      const country = click.country || "unknown";
      const device = click.device || "unknown";
     const day = click.created_at
  ? new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date(click.created_at))
  : "unknown";

      bySource[source] = (bySource[source] || 0) + 1;
      byCountry[country] = (byCountry[country] || 0) + 1;
      byDevice[device] = (byDevice[device] || 0) + 1;

     if (!byLink[click.link_id]) {
  byLink[click.link_id] = {
    id: click.link_id,
    name: linkMap[click.link_id]?.name || "Enlace desconocido",
    slug: linkMap[click.link_id]?.slug || null,
    clicks: 0,
    sources: {}
  };
}

byLink[click.link_id].clicks++;

byLink[click.link_id].sources[source] =
  (byLink[click.link_id].sources[source] || 0) + 1;

      byDay[day] = (byDay[day] || 0) + 1;
    });

    return res.status(200).json({
      total_clicks: totalClicks,
      by_source: bySource,
      by_country: byCountry,
      by_device: byDevice,
      by_link: Object.values(byLink),
      by_day: byDay
    });

  } catch (error) {
    console.error("Error obteniendo estadísticas:", error);

    return res.status(500).json({
      error: "No se pudieron obtener las estadísticas",
      details: error.message
    });
  }
}
