export async function onRequest(context) {
    const { env } = context;
    const { DB } = env; // D1 Database binding
    const now = new Date().toISOString();

    try {
        // 1. Query D1 for all articles valid for SEO
        const stmt = env.DB.prepare(
            `SELECT slug, language, updated_at FROM articles
             WHERE status = 'published'
             AND visibility = 'public'
             AND (publish_at IS NULL OR publish_at <= ?)`
        ).bind(now);
        const { results } = await stmt.all();

        // 2. Build the XML string
        const baseUrl = "https://flowork.cloud"; // English Hardcode
        let xml = `<?xml version="1.0" encoding="UTF-8"?>`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        // 3. Add static pages (optional, but good for SEO)
        xml += `<url><loc>${baseUrl}/</loc><priority>1.0</priority></url>`; // English Hardcode
        xml += `<url><loc>${baseUrl}/login</loc><priority>0.5</priority></url>`; // English Hardcode
        xml += `<url><loc>${baseUrl}/register</loc><priority>0.5</priority></url>`; // English Hardcode

        // 4. Loop D1 results and add to XML
        if (results) {
            for (const article of results) {
                // --- (PERBAIKAN KUNCI) ---
                const lang = article.language || 'en'; // English Hardcode
                const url = `${baseUrl}/p-${article.slug}-${lang}.html`; // Format URL baru
                // --- (AKHIR PERBAIKAN KUNCI) ---

                // Use 'updated_at' for <lastmod>
                const lastMod = article.updated_at ? new Date(article.updated_at).toISOString() : new Date(now).toISOString();

                xml += `<url><loc>${url}</loc><lastmod>${lastMod}</lastmod><priority>0.8</priority></url>`; // English Hardcode
            }
        }

        xml += `</urlset>`;

        // 5. Send the response as XML
        return new Response(xml, {
            headers: {
                'Content-Type': 'application/xml', // English Hardcode
                // --- (PERBAIKAN KUNCI: CACHE API) ---
                // NOTE: Changed from 'no-cache' to 'max-age=3600' (1 hour)
                'Cache-Control': 'public, max-age=3600' // English Hardcode
            }
        });

    } catch (e) {
        console.error("Failed to generate sitemap.xml:", e.message); // English Log
        return new Response(e.message, { status: 500 });
    }
}