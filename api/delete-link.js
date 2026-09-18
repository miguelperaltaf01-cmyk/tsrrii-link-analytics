export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método no permitido"
    });
  }

  try {
    const adminKey = req.headers["x-admin-key"];

    if (!adminKey || adminKey !== process.env.DELETE_ADMIN_KEY) {
      return res.status(401).json({
        error: "No autorizado"
      });
    }

    const { link_ids } = req.body || {};

    if (!Array.isArray(link_ids) || link_ids.length === 0) {
      return res.status(400).json({
        error: "No se seleccionaron enlaces"
      });
    }

    const uniqueIds = [...new Set(link_ids)];

    const ids = uniqueIds.join(",");

    const clicksUrl =
      process.env.SUPABASE_URL +
      "/rest/v1/clicks?link_id=in.(" +
      ids +
      ")";

    const clicksResponse = await fetch(clicksUrl, {
      method: "DELETE",
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization":
          "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });

    if (!clicksResponse.ok) {
      const error = await clicksResponse.text();

      console.error(
        "Error eliminando clics:",
        error
      );

      return res.status(clicksResponse.status).json({
        error: "No se pudieron eliminar los clics asociados"
      });
    }

    const linksUrl =
      process.env.SUPABASE_URL +
      "/rest/v1/links?id=in.(" +
      ids +
      ")";

    const linksResponse = await fetch(linksUrl, {
      method: "DELETE",
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization":
          "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Prefer": "return=representation"
      }
    });

    if (!linksResponse.ok) {
      const error = await linksResponse.text();

      console.error(
        "Error eliminando enlaces:",
        error
      );

      return res.status(linksResponse.status).json({
        error: "No se pudieron eliminar los enlaces"
      });
    }

    const deletedLinks = await linksResponse.json();

    return res.status(200).json({
      success: true,
      deleted: deletedLinks.length
    });

  } catch (error) {

    console.error(
      "Error eliminando enlaces:",
      error
    );

    return res.status(500).json({
      error: "Error interno del servidor"
    });
  }
}
