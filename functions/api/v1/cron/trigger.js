//#######################################################################
//# WEBSITE https://flowork.cloud
//# File NAME : C:\FLOWORK\flowork-gui\template\web\functions\api\v1\cron\trigger.js
//# DESKRIPSI: PERBAIKAN. Mengubah response dari JSON ke text/plain
//#            agar bisa dibaca oleh cron-job.org sebagai laporan sukses.
//#######################################################################

/**
 * Helper: Mengembalikan respon sebagai text/plain, BUKAN JSON.
 */
function textReportResponse(message, status = 200) {
    return new Response(message, { // Kembalikan string mentah
        status: status,
        headers: { 'Content-Type': 'text/plain' } // Set content type ke text
    });
}

/**
 * Helper untuk purge cache Cloudflare (opsional tapi bagus)
 */
async function purgeCacheByUrl(env, url) {
    const { CLOUDFLARE_API_TOKEN, CLOUDFLARE_ZONE_ID } = env;
    if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
        console.error("[Cron Worker] Cache purge failed: Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID env variables."); // English Log
        return;
    }
    console.log(`[Cron Worker] Purging cache for: ${url}`); // English Log
    try {
        await fetch(`https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache`, {
            method: 'POST', // English Hardcode
            headers: {
                'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`, // English Hardcode
                'Content-Type': 'application/json' // English Hardcode
            },
            body: JSON.stringify({ files: [url] }) // English Hardcode
        });
    } catch (e) {
        console.error(`[Cron Worker] Cache purge fetch request failed: ${e.message}`); // English Log
    }
}

/**
 * Entry point untuk Cron Job manual via URL
 * Panggil URL ini: .../api/v1/cron/trigger?key=KUNCI_RAHASIA_ANDA
 */
export async function onRequest(context) {
    const { request, env } = context;
    const { DB } = env;

    // 1. Keamanan: Cek Kunci Rahasia
    const SECRET_KEY = env.CRON_SECRET_KEY;
    if (!SECRET_KEY) {
        return textReportResponse("Error: Server is not configured for cron jobs (CRON_SECRET_KEY is not set).", 500); // English Hardcode
    }

    const url = new URL(request.url);
    const providedKey = url.searchParams.get('key');
    if (providedKey !== SECRET_KEY) {
        console.warn("[Cron Worker] Unauthorized cron trigger attempt."); // English Log
        return textReportResponse("Error: Unauthorized.", 401); // English Hardcode
    }

    const now = new Date().toISOString();
    console.log(`[Cron Worker] Manual trigger received. Checking for articles to publish as of ${now}...`); // English Log

    try {
        // 2. Cari artikel yang statusnya 'pending' dan waktu publish_at sudah lewat
        const stmt = DB.prepare(
            `SELECT id, slug, language FROM articles WHERE status = ?1 AND publish_at IS NOT NULL AND publish_at <= ?2`
        ).bind('pending', now); // English Hardcode
        const { results } = await stmt.all();

        if (!results || results.length === 0) {
            console.log("[Cron Worker] No articles to publish."); // English Log
            return textReportResponse("Success: No articles to publish."); // English Hardcode
        }

        console.log(`[Cron Worker] Found ${results.length} articles to publish...`); // English Log

        const purgePromises = [];
        const updatePromises = [];

        // 3. Update status mereka ke 'published'
        for (const article of results) {
            const updateStmt = DB.prepare(
                `UPDATE articles SET status = 'published' WHERE id = ?` // English Hardcode
            ).bind(article.id);
            updatePromises.push(updateStmt.run());

            // 4. (PENTING) Siapkan cache purge untuk format URL baru
            const lang = article.language || 'en'; // English Hardcode
            const articleUrl = `https://flowork.cloud/fs-${article.slug}-${lang}.html`; // English Hardcode
            purgePromises.push(purgeCacheByUrl(env, articleUrl));
        }

        // 5. Purge sitemap juga
        purgePromises.push(purgeCacheByUrl(env, `https://flowork.cloud/sitemap.xml`)); // English Hardcode

        // 6. Eksekusi semua
        await Promise.all(updatePromises);
        await Promise.all(purgePromises);

        console.log(`[Cron Worker] Successfully published ${results.length} articles.`); // English Log
        return textReportResponse(`Success: Published ${results.length} articles.`); // English Hardcode

    } catch (e) {
        console.error("[Cron Worker] Scheduled Publisher failed:", e.message); // English Log
        return textReportResponse(`Error: ${e.message}`, 500);
    }
}