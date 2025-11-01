// Ini adalah web worker, dia berjalan di thread terpisah dari UI utama.
// Tujuannya adalah melakukan pekerjaan berat tanpa membuat UI menjadi lag.
self.onmessage = (event) => {
  // Komentar dalam Bahasa Indonesia: Worker menerima data dari thread utama.
  console.log('[Worker] Menerima data dari thread utama:', event.data);
  const { nodes } = event.data;

  // Cek jika tidak ada node, kirim pesan error kembali
  if (!nodes || nodes.length === 0) {
      self.postMessage({ type: 'LAYOUT_ERROR', error: 'No nodes to process.' });
      return;
  }

  // Simulasi kalkulasi layout yang berat (misalnya algoritma force-directed)
  // Untuk contoh ini, kita hanya akan menata ulang node dalam bentuk grid sederhana.
  const spacingX = 250;
  const spacingY = 150;
  const nodesPerRow = Math.ceil(Math.sqrt(nodes.length));

  const updatedNodes = nodes.map((node, index) => {
    // Pastikan kita tidak mengubah objek aslinya, buat objek baru
    return {
      ...node,
      position: {
        x: (index % nodesPerRow) * spacingX,
        y: Math.floor(index / nodesPerRow) * spacingY,
      },
    };
  });

  // Komentar dalam Bahasa Indonesia: Simulasi jeda waktu untuk meniru proses yang memakan waktu.
  // Di skenario nyata, bagian ini adalah tempat kalkulasi berat yang sebenarnya.
  let i = 0;
  while (i < 500000000) { // Ini sengaja untuk "membuang" waktu CPU agar terasa prosesnya
    i++;
  }

  // Komentar dalam Bahasa Indonesia: Kalkulasi selesai, kirim data kembali ke thread utama.
  console.log('[Worker] Kalkulasi selesai, mengirim data kembali.');

  // Kirim hasilnya kembali ke thread utama
  self.postMessage({ type: 'LAYOUT_COMPLETE', nodes: updatedNodes });
};