//#######################################################################
// WEBSITE https://flowork.cloud
// File NAME : C:\FLOWORK\flowork-gui\template\web\functions\api\v1\marketplace\publish.js total lines 80 
//#######################################################################

import { ethers } from 'ethers';

async function verify(req) {
  try {
    const addr = req.headers.get('X-User-Address');
    const sig = req.headers.get('X-Signature');
    const msg = req.headers.get('X-Signed-Message');
    if (!addr || !sig || !msg) return null;
    const parts = msg.split('|');
    const ts = parseInt(parts[parts.length - 1].trim());
    if (isNaN(ts)) return null;
    const now = Date.now() / 1000;
    if (now - ts > 600 || ts - now > 600) return null;

    const recovered = ethers.verifyMessage(msg, sig);
    return (recovered.toLowerCase() === addr.toLowerCase()) ? addr.toLowerCase() : null;
  } catch (e) { return null; }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const author = await verify(request);
  if (!author) {
    return new Response(JSON.stringify({ error: "Unauthorized: Invalid or expired signature" }), {
      status: 401, headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { type, name, desc, data, price = 0 } = body;
    if (!type || !name || !data) {
      return new Response(JSON.stringify({ error: "Missing required fields (type, name, data)" }), {
         status: 400, headers: { "Content-Type": "application/json" }
      });
    }
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS marketplace (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        desc TEXT,
        author TEXT NOT NULL,
        data TEXT NOT NULL,
        price REAL DEFAULT 0,
        dl INT DEFAULT 0,
        likes INT DEFAULT 0,
        ts INT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_mkp_type ON marketplace(type);
      CREATE INDEX IF NOT EXISTS idx_mkp_ts ON marketplace(ts);
      CREATE INDEX IF NOT EXISTS idx_mkp_author ON marketplace(author);
    `);
    const id = crypto.randomUUID();
    const dataFinal = (typeof data === 'object') ? JSON.stringify(data) : String(data);

    await env.DB.prepare(`
      INSERT INTO marketplace (id, type, name, desc, author, data, price, ts)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
    `).bind(id, type, name, desc, author, dataFinal, price, Date.now()).run();

    return new Response(JSON.stringify({
      success: true,
      id: id,
      message: "Item published successfully"
    }), {
      status: 201, headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
