export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const { name, slug, destination_url } = req.body;

    if (!name || !slug || !destination_url) {
      return res.status(400).json({
        error: "Faltan datos obligatorios"
      });
    }
const existingResponse = await fetch(
  `${process.env.SUPABASE_URL}/rest/v1/links?select=id&slug=eq.${encodeURIComponent(slug)}`,
  {
    method: "GET",
    headers: {
      "apikey": process.env.SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`
    }
  }
);

if (!existingResponse.ok) {
  const error = await existingResponse.text();

  return res.status(existingResponse.status).json({
    error
  });
}

const existingLinks = await existingResponse.json();

if (existingLinks.length > 0) {
  return res.status(409).json({
    error: "Ese slug ya existe. Elegí otro nombre."
  });
}
    const response = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/links`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": process.env.SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${process.env.SUPABASE_ANON_KEY}`,
          "Prefer": "return=representation"
        },
        body: JSON.stringify({
          name,
          slug,
          destination_url
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data
      });
    }

    return res.status(200).json({
      success: true,
      link: data[0]
    });

  } catch (error) {

    return res.status(500).json({
      error: error.message
    });

  }

}
