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

    const { link_ids, archived } = req.body || {};

    if (!Array.isArray(link_ids) || link_ids.length === 0) {
      return res.status(400).json({
        error: "No se seleccionaron enlaces"
      });
    }

    if (typeof archived !== "boolean") {
      return res.status(400).json({
        error: "Estado de archivo inválido"
      });
    }

    const uniqueIds = [...new Set(link_ids)];

    const ids = uniqueIds.join(",");

    const linksUrl =
      process.env.SUPABASE_URL +
      "/rest/v1/links?id=in.(" +
      ids +
      ")";

    const response = await fetch(linksUrl, {
      method: "PATCH",
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization":
          "Bearer " + process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
      },
      body: JSON.stringify({
        archived
      })
    });

    if (!response.ok) {
      const error = await response.text();

      console.error(
        "Error actualizando enlaces:",
        error
      );

      return res.status(response.status).json({
        error: "No se pudieron actualizar los enlaces"
      });
    }

    const updatedLinks = await response.json();

    return res.status(200).json({
      success: true,
      archived,
      updated: updatedLinks.length
    });

  } catch (error) {

    console.error(
      "Error archivando enlaces:",
      error
    );

    return res.status(500).json({
      error: "Error interno del servidor"
    });
  }
}
