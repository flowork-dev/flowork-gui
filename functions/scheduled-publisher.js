export default {
  // Fungsi ini akan dipanggil oleh trigger Cron
  async scheduled(event, env, ctx) {
    console.log(`[Cron Worker] Running scheduled task at: ${new Date(event.scheduledTime)}`); // English Log

    try {
      const db = env.DB; // Dapatkan D1 binding
      const now = new Date().toISOString();

      // 1. Cari artikel yang statusnya 'pending' dan waktu publish_at sudah lewat
      const stmtSelect = db.prepare(
        `SELECT id FROM articles
         WHERE status = ?1 AND publish_at IS NOT NULL AND publish_at <= ?2`
      ).bind('pending', now); // English Hardcode
      const { results } = await stmtSelect.all();

      if (!results || results.length === 0) {
        console.log("[Cron Worker] No articles to publish."); // English Log
        return; // Tidak ada yang perlu diupdate
      }

      console.log(`[Cron Worker] Found ${results.length} articles to publish.`); // English Log

      // 2. Siapkan statement UPDATE
      const stmtUpdate = db.prepare(
        `UPDATE articles SET status = ?1, updated_at = ?2 WHERE id = ?3`
      ).bind('published', now); // English Hardcode

      // 3. Buat batch update
      const batch = results.map(article => stmtUpdate.bind(article.id));

      // 4. Eksekusi batch
      const batchResult = await db.batch(batch);

      // 5. Log hasil batch (opsional, bagus untuk debug)
      let successCount = 0;
      batchResult.forEach((result, index) => {
        if (result.success) {
          successCount++;
          console.log(`[Cron Worker] Successfully published article ID: ${results[index].id}`); // English Log
        } else {
          console.error(`[Cron Worker] FAILED to publish article ID: ${results[index].id}. Error: ${result.cause}`); // English Log
        }
      });
      console.log(`[Cron Worker] Published ${successCount} out of ${results.length} articles.`); // English Log

    } catch (e) {
      console.error(`[Cron Worker] CRITICAL ERROR during scheduled task: ${e.message}`); // English Log
      // Penting: Jangan throw error di sini agar Cron tidak di-disable otomatis oleh Cloudflare
    }
  }
};