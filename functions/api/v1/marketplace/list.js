//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\functions\api\v1\marketplace\list.js total lines 51 
//#######################################################################

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  const author = url.searchParams.get('author');
  const limit = Math.min(100, parseInt(url.searchParams.get('limit') || '50'));
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    let sql = "SELECT id, type, name, desc, author, price, dl, likes, ts FROM marketplace";
    const params = [];
    const conditions = [];

    if (type) {
        conditions.push("type = ?");
        params.push(type);
    }
    if (author) {
        conditions.push("author = ?");
        params.push(author.toLowerCase());
    }
    if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY ts DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    const stmt = env.DB.prepare(sql).bind(...params);
    const { results } = await stmt.all();
    return new Response(JSON.stringify(results || []), {
      status: 200,
      headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60"
      }
    });

  } catch (e) {
    if (e.message && e.message.includes("no such table")) {
        return new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
