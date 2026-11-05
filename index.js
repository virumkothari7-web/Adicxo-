
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;

    const json = (data, status = 200) =>
      Response.json(data, { status });

    // API health check
    if (url.pathname === "/api/status" && method === "GET") {
      return json({
        project: "Adicxo",
        service: "Adicxo Edge API",
        status: "operational",
        version: "2.0.0"
      });
    }

    // Project information
    if (url.pathname === "/api/info" && method === "GET") {
      return json({
        name: "Adicxo",
        description: "Technology, AI and digital products",
        founder: "Adicxo Team"
      });
    }

    // Server time
    if (url.pathname === "/api/time" && method === "GET") {
      return json({
        timestamp: new Date().toISOString(),
        timezone: "UTC"
      });
    }

    // List all projects
    if (url.pathname === "/api/projects" && method === "GET") {
      const result = await env.DB.prepare(
        "SELECT * FROM projects ORDER BY id"
      ).all();

      return json(result.results);
    }

    // Get one project
    const match = url.pathname.match(/^\/api\/projects\/(\d+)$/);

    if (match && method === "GET") {
      const project = await env.DB.prepare(
        "SELECT * FROM projects WHERE id = ?"
      ).bind(match[1]).first();

      return project
        ? json(project)
        : json({ error: "Project not found" }, 404);
    }

    // Protect write operations
    if (
      (url.pathname === "/api/projects" &&
        method === "POST") ||
      (match && ["PUT", "DELETE"].includes(method))
    ) {
      if (!env.API_SECRET) {
        return json({ error: "API authentication not configured" }, 503);
      }

      if (request.headers.get("Authorization") !==
          `Bearer ${env.API_SECRET}`) {
        return json({ error: "Unauthorized" }, 401);
      }
    }

    // Add a project
    if (url.pathname === "/api/projects" && method === "POST") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      const { name, description = "", status = "development" } = body;

      if (typeof name !== "string" || !name.trim()) {
        return json({ error: "Project name is required" }, 400);
      }

      if (!["active", "development", "paused"].includes(status)) {
        return json({ error: "Invalid project status" }, 400);
      }

      const result = await env.DB.prepare(
        `INSERT INTO projects (name, description, status)
         VALUES (?, ?, ?)`
      ).bind(name.trim(), description, status).run();

      return json({
        success: true,
        id: result.meta.last_row_id,
        message: "Project created"
      }, 201);
    }

    // Update a project
    if (match && method === "PUT") {
      let body;

      try {
        body = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      const { name, description, status } = body;

      if (typeof name !== "string" || !name.trim()) {
        return json({ error: "Valid project name is required" }, 400);
      }

      if (typeof description !== "string") {
        return json({ error: "Description must be a string" }, 400);
      }

      if (!["active", "development", "paused"].includes(status)) {
        return json({ error: "Invalid project status" }, 400);
      }

      const result = await env.DB.prepare(
        `UPDATE projects
         SET name = ?, description = ?, status = ?
         WHERE id = ?`
      ).bind(name.trim(), description, status, match[1]).run();

      if (!result.meta.changes) {
        return json({ error: "Project not found" }, 404);
      }

      return json({ success: true, message: "Project updated" });
    }

    // Delete a project
    if (match && method === "DELETE") {
      const result = await env.DB.prepare(
        "DELETE FROM projects WHERE id = ?"
      ).bind(match[1]).run();

      if (!result.meta.changes) {
        return json({ error: "Project not found" }, 404);
      }

      return json({ success: true, message: "Project deleted" });
    }

    return json({ error: "Endpoint not found" }, 404);
  }
};
