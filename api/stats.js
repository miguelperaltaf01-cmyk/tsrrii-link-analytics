export default async function handler(req, res) {
  try {
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/clicks?select=id,created_at,link_id,country,device,source`,
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

    const clicks = await response.json();

    const totalClicks = clicks.length;

    const bySource = {};
    const byCountry = {};
    const byDevice = {};
    const byLink = {};
    const byDay = {};

    clicks.forEach((click) => {
      const source = click.source || "direct";
      const country = click.country || "unknown";
      const device = click.device || "unknown";
      const day = click.created_at
        ? click.created_at.slice(0, 10)
        : "unknown";

      bySource[source] = (bySource[source] || 0) + 1;
      byCountry[country] = (byCountry[country] || 0) + 1;
      byDevice[device] = (byDevice[device] || 0) + 1;
      byLink[click.link_id] = (byLink[click.link_id] || 0) + 1;
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return res.status(200).json({
      total_clicks: totalClicks,
      by_source: bySource,
      by_country: byCountry,
      by_device: byDevice,
      by_link: byLink,
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
