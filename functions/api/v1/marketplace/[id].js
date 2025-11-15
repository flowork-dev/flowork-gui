//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\functions\api\v1\marketplace\[id].js total lines 32 
//#######################################################################

export async function onRequestGet(context) {
  const { env, params } = context;
  const itemId = params.id;
  try {
    const item = await env.DB.prepare("SELECT * FROM marketplace WHERE id = ?").bind(itemId).first();
    if (!item) {
      return new Response(JSON.stringify({ error: "Item not found" }), {
        status: 404, headers: { "Content-Type": "application/json" }
      });
    }
    context.waitUntil(
        env.DB.prepare("UPDATE marketplace SET dl = dl + 1 WHERE id = ?").bind(itemId).run()
    );
    return new Response(JSON.stringify(item), {
      status: 200,
      headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, max-age=0"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
