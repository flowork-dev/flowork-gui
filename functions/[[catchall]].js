import { ethers } from 'ethers';

/**
 * Handles CORS preflight requests (OPTIONS).
 */
function handleOptions(request) {
    const origin = request.headers.get('Origin');
    const accessControlRequestMethod = request.headers.get('Access-Control-Request-Method');
    const accessControlRequestHeaders = request.headers.get('Access-Control-Request-Headers');
    const headers = new Headers();
    if (origin) {
        headers.set('Access-Control-Allow-Origin', origin);
    }
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // English Hardcode
    if (accessControlRequestHeaders) {
        headers.set('Access-Control-Allow-Headers', accessControlRequestHeaders);
    } else {
        headers.set('Access-Control-Allow-Headers', 'Content-Type, X-User-Address, X-Signature, X-Signed-Message, X-Flowork-Engine-ID'); // English Hardcode
    }
    headers.set('Access-Control-Max-Age', '86400');
    return new Response(null, {
        status: 204,
        headers: headers
    });
}


/**
 * Helper: Adds CORS headers to a standard JSON response.
 */
function jsonResponse(data, status = 200, headers = {}) {
    const defaultHeaders = {
        'Content-Type': 'application/json', // English Hardcode
        'Access-Control-Allow-Origin': '*' // Allow all origins
    };
    return new Response(JSON.stringify(data), {
        status: status,
        headers: { ...defaultHeaders, ...headers }
    });
}

/**
 * Helper: Verifies the crypto signature from headers.
 */
async function verifySignature(request) {
    try {
        const address = request.headers.get('X-User-Address'); // English Hardcode
        const signature = request.headers.get('X-Signature'); // English Hardcode
        const message = request.headers.get('X-Signed-Message'); // English Hardcode

        if (!address || !signature || !message) {
            console.warn('[AUTH] Missing crypto headers'); // English Log
            return null;
        }

        const messageParts = message.split('|');
        if (messageParts.length < 3) {
            console.warn('[AUTH] Invalid message format'); // English Log
            return null;
        }
        const timestamp = parseInt(messageParts[messageParts.length - 1], 10);
        const nowInSeconds = Math.floor(Date.now() / 1000);

        if (Math.abs(nowInSeconds - timestamp) > 300) {
            console.warn(`[AUTH] Stale signature. Now: ${nowInSeconds}, TS: ${timestamp}`); // English Log
            return null;
        }

        const recoveredAddress = ethers.verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
            return recoveredAddress; // Valid
        } else {
            console.warn('[AUTH] Signature mismatch'); // English Log
            return null;
        }
    } catch (e) {
        console.error(`[AUTH] Signature verification error: ${e.message}`); // English Log
        return null;
    }
}


// --- API Handlers ---

// GET /my-articles
async function handleGetMyArticles(context, authorId) {
    const { env } = context;
    try {
        // (KODE ASLI) Ambil 'id' juga
        const stmt = env.DB.prepare(
            `SELECT id, title, slug, category, status, publish_at, updated_at, language
             FROM articles WHERE author_id = ? ORDER BY updated_at DESC`
        ).bind(authorId);
        const { results } = await stmt.all();
        return jsonResponse(results || []);
    } catch (e) {
        return jsonResponse({ error: e.message }, 500); // English Hardcode
    }
}

// POST /articles
async function handleCreateArticle(context, authorId, request) {
    const { env } = context;
    try {
        const data = await request.json();

        if (!data.title || !data.slug || !data.content || !data.category) {
            return jsonResponse({ error: "Missing required fields: title, slug, content, category" }, 400); // English Hardcode
        }

        const now = new Date().toISOString();
        const desiredStatus = data.status || 'pending'; // English Hardcode
        const dbStatus = (desiredStatus === 'scheduled') ? 'pending' : desiredStatus; // English Hardcode

        // --- (PERBAIKAN KUNCI) ---
        // Logika publish_at disesuaikan:
        // 1. Jika 'scheduled' dan ada tanggal -> gunakan tanggal itu
        // 2. Jika 'published' -> gunakan NULL (artinya "langsung")
        // 3. Lainnya (draft, pending) -> gunakan NULL
        const publish_at = (desiredStatus === 'scheduled' && data.publish_at) ? data.publish_at : null;
        // --- (AKHIR PERBAIKAN) ---

        const language = data.language || 'en'; // English Hardcode
        const price = (data.category === 'marketplace' && data.price) ? parseFloat(data.price) : null; // English Hardcode
        const product_url = (data.category === 'marketplace' && data.product_url) ? data.product_url : null; // English Hardcode

        const meta_description = data.meta_description || null;
        const keywords = data.keywords || null;
        const tags = data.tags || null;

        const newId = crypto.randomUUID();

        const stmt = env.DB.prepare(
            `INSERT INTO articles
             (id, title, slug, content, category, author_id, author_username, status, visibility, language, price, product_url, publish_at, created_at, updated_at, meta_description, keywords, tags)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?14, ?15, ?16, ?17)` // English Hardcode
        ).bind(
            newId, // Bind 'id'
            data.title, data.slug, data.content, data.category,
            authorId, data.author_username || 'Anonymous', // English Hardcode
            dbStatus, data.visibility || 'public',
            language, price, product_url, publish_at, now,
            meta_description, keywords, tags
        );
        await stmt.run();

        const createdArticle = {
            ...data,
            id: newId,
            author_id: authorId,
            created_at: now,
            updated_at: now,
            publish_at: publish_at,
            status: desiredStatus
        };
        return jsonResponse(createdArticle, 201); // English Hardcode

    } catch (e) {
        if (e.message.includes('UNIQUE constraint failed')) { // English Hardcode
            return jsonResponse({ error: 'This slug is already in use.' }, 409); // English Hardcode
        }
        console.error("Create Article Error:", e.message); // English Log
        return jsonResponse({ error: e.message }, 500); // English Hardcode
    }
}

// GET /articles/:id/edit
async function handleGetArticleForEdit(context, authorId, articleId) {
     const { env } = context;
    try {
        const stmt = env.DB.prepare(
            `SELECT * FROM articles WHERE id = ? AND author_id = ?`
        ).bind(articleId, authorId);
        const result = await stmt.first();

        if (result) {
            if (result.status === 'pending' && result.publish_at && new Date(result.publish_at) > new Date()) { // English Hardcode
                result.status = 'scheduled'; // English Hardcode
            }
            return jsonResponse(result);
        } else {
            console.warn(`[GetForEdit] Article not found for ID: ${articleId}, author: ${authorId}`); // English Log
            return jsonResponse({ error: "Article not found or you do not have permission to edit it." }, 404); // English Hardcode
        }
    } catch (e) {
        console.error(`[GetForEdit] Error: ${e.message}`); // English Log
        return jsonResponse({ error: e.message }, 500); // English Hardcode
    }
}

// PUT /articles/:id
async function handleUpdateArticle(context, authorId, articleId, request) {
    const { env } = context;
    try {
        const data = await request.json();

        if (!articleId || data.id !== articleId) {
            return jsonResponse({ error: "Article ID mismatch." }, 400); // English Hardcode
        }

        const now = new Date().toISOString();
        const desiredStatus = data.status || 'pending'; // English Hardcode
        const dbStatus = (desiredStatus === 'scheduled') ? 'pending' : desiredStatus; // English Hardcode

        // --- (PERBAIKAN KUNCI) ---
        // Logika yang sama dengan 'Create'
        const publish_at = (desiredStatus === 'scheduled' && data.publish_at) ? data.publish_at : null;
        // --- (AKHIR PERBAIKAN) ---

        const language = data.language || 'en'; // English Hardcode
        const price = (data.category === 'marketplace' && data.price) ? parseFloat(data.price) : null; // English Hardcode
        const product_url = (data.category === 'marketplace' && data.product_url) ? data.product_url : null; // English Hardcode

        const meta_description = data.meta_description || null;
        const keywords = data.keywords || null;
        const tags = data.tags || null;

        const stmt = env.DB.prepare(
            `UPDATE articles
             SET title = ?1, slug = ?2, content = ?3, category = ?4, status = ?5,
                 visibility = ?6, language = ?7, price = ?8, product_url = ?9,
                 publish_at = ?10, updated_at = ?11,
                 meta_description = ?12, keywords = ?13, tags = ?14
             WHERE id = ?15 AND author_id = ?16`
        ).bind(
            data.title, data.slug, data.content, data.category, dbStatus, // ?1 - ?5
            data.visibility, language, price, product_url,             // ?6 - ?9
            publish_at, now,                                           // ?10 - ?11
            meta_description, keywords, tags,                          // ?12 - ?14
            articleId, // ?15 (untuk WHERE id)
            authorId   // ?16 (untuk WHERE author_id)
        );

        await stmt.run();

        return jsonResponse({ status: 'updated', slug: data.slug }); // English Hardcode

    } catch (e) {
         if (e.message.includes('UNIQUE constraint failed')) { // English Hardcode
            return jsonResponse({ error: 'This slug is already in use.' }, 409); // English Hardcode
        }
        console.error(`[UpdateArticle] Error: ${e.message}`); // English Log
        return jsonResponse({ error: e.message }, 500); // English Hardcode
    }
}

// DELETE /articles/:id
async function handleDeleteArticle(context, authorId, articleId) {
    const { env } = context;
    try {
        const stmt = env.DB.prepare(
            `DELETE FROM articles WHERE id = ? AND author_id = ?`
        ).bind(articleId, authorId);

        await stmt.run();

        console.log(`[DeleteArticle] Article delete processed for: ${articleId}, author: ${authorId}`); // English Log
        return jsonResponse({ status: 'deleted', message: 'Article deleted successfully.', id: articleId }, 200); // English Hardcode

    } catch (e) {
        console.error(`[DeleteArticle] Error: ${e.message}`); // English Log
        return jsonResponse({ error: e.message }, 500); // English Hardcode
    }
}

// GET /articles/:slug/comments (Public)
async function handleGetComments(context, slug) {
    const { env } = context;
     try {
        const articleStmt = env.DB.prepare(`SELECT id FROM articles WHERE slug = ? AND status = 'published'`).bind(slug); // English Hardcode
        const article = await articleStmt.first();

        if (!article) {
            return jsonResponse({ error: "Article not found" }, 404); // English Hardcode
        }

        const stmt = env.DB.prepare(
            `SELECT id, parent_id, author_username, content, created_at
             FROM comments
             WHERE article_id = ? AND status = 'approved'
             ORDER BY created_at DESC`
        ).bind(article.id);
        const { results } = await stmt.all();
        return jsonResponse(results || []);

    } catch (e) {
        return jsonResponse({ error: e.message }, 500); // English Hardcode
    }
}

// POST /articles/:slug/comments (Authenticated)
async function handlePostComment(context, authorId, slug, request) {
    const { env } = context;
    try {
        const data = await request.json();
        const { content, parent_id } = data;

        if (!content) {
            return jsonResponse({ error: "Comment content is required" }, 400); // English Hardcode
        }

        const articleStmt = env.DB.prepare(`SELECT id FROM articles WHERE slug = ? AND status = 'published'`).bind(slug); // English Hardcode
        const article = await articleStmt.first();
        if (!article) {
            return jsonResponse({ error: "Article not found" }, 404); // English Hardcode
        }

        const author_username = "User " + authorId.substring(2, 6); // Placeholder // English Hardcode
        const now = new Date().toISOString();
        const status = 'pending'; // All comments must be approved // English Hardcode

        const newId = crypto.randomUUID();

        const stmt = env.DB.prepare(
            `INSERT INTO comments
             (id, article_id, parent_id, author_id, author_username, content, status, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)` // English Hardcode
        ).bind(
            newId, // Bind 'id'
            article.id, parent_id || null, authorId, author_username,
            content, status, now
        );
        await stmt.run();

        return jsonResponse({
            id: newId,
            parent_id: parent_id || null,
            author_id: authorId,
            author_username: author_username,
            content: content,
            status: status,
            created_at: now
        }, 201);

    } catch (e) {
        return jsonResponse({ error: e.message }, 500); // English Hardcode
    }
}


/**
 * Main entry point for the Worker.
 */
export async function onRequest(context) {
    const { request } = context;

    if (request.method === 'OPTIONS') { // English Hardcode
        return handleOptions(request);
    }

    const url = new URL(request.url);
    const { pathname } = url;

    const segments = pathname.split('/').filter(Boolean);
    const contentApiPrefixIndex = segments.indexOf('content'); // English Hardcode

    if (contentApiPrefixIndex === -1) {
        console.warn(`[API Worker] Path does not contain 'content'. Path: ${pathname}`); // English Log
        return jsonResponse({ error: 'Invalid API path for content worker' }, 404); // English Hardcode
    }

    const route = segments.slice(contentApiPrefixIndex + 1).join('/');

    // Rute Publik (GET Comments) - tidak perlu auth
    let match = route.match(/^articles\/([^/]+)\/comments$/); // English Hardcode
    if (match && request.method === 'GET') { // English Hardcode
        return handleGetComments(context, match[1]);
    }
    // --- End Public Route ---


    // All other routes require authentication
    const authorId = await verifySignature(request);
    if (!authorId) {
        return jsonResponse({ error: 'Invalid or missing signature' }, 401); // English Hardcode
    }

    // --- Router (Private Routes) ---
    try {
        // GET /my-articles
        if (route === 'my-articles' && request.method === 'GET') { // English Hardcode
            return handleGetMyArticles(context, authorId);
        }

        // POST /articles
        if (route === 'articles' && request.method === 'POST') { // English Hardcode
            return handleCreateArticle(context, authorId, request);
        }

        // GET /articles/:id/edit
        match = route.match(/^articles\/([^/]+)\/edit$/); // English Hardcode
        if (match && request.method === 'GET') { // English Hardcode
            return handleGetArticleForEdit(context, authorId, match[1]); // match[1] is the article ID
        }

        // PUT /articles/:id
        match = route.match(/^articles\/([^/]+)$/); // English Hardcode
        if (match && request.method === 'PUT') { // English Hardcode
            return handleUpdateArticle(context, authorId, match[1], request); // match[1] is the article ID
        }

        // DELETE /articles/:id
        match = route.match(/^articles\/([^/]+)$/); // English Hardcode
        if (match && request.method === 'DELETE') { // English Hardcode
            return handleDeleteArticle(context, authorId, match[1]); // match[1] is the article ID
        }

        // POST /articles/:slug/comments
        match = route.match(/^articles\/([^/]+)\/comments$/); // English Hardcode
        if (match && request.method === 'POST') { // English Hardcode
            return handlePostComment(context, authorId, match[1], request);
        }

        console.warn(`[API Worker] Route not matched: ${route}`); // English Log
        return jsonResponse({ error: 'Route not found' }, 404); // English Hardcode

    } catch (e) {
        return jsonResponse({ error: `Unhandled exception: ${e.message}` }, 500); // English Hardcode
    }
}