
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/status") {
      return Response.json({
        project: "Adicxo",
        service: "Adicxo Edge API",
        status: "operational",
        version: "1.0.0"
      });
    }

    if (url.pathname === "/api/info") {
      return Response.json({
        name: "Adicxo",
        description: "Technology, AI and digital products",
        founder: "Adicxo Team"
      });
    }

    if (url.pathname === "/api/time") {
      return Response.json({
        timestamp: new Date().toISOString(),
        timezone: "UTC"
      });
    }

    if (url.pathname === "/api/projects") {
      const result = await env.DB.prepare(
        "SELECT * FROM projects ORDER BY id"
      ).all();

      return Response.json(result.results);
    }

    return Response.json(
      { error: "Endpoint not found" },
      { status: 404 }
    );
  }
};
