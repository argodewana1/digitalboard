import { put, list, del } from "@vercel/blob";

export default async function handler(req, res) {
  console.log(`[LOG] Menerima permintaan dengan metode: ${req.method}`);

  if (req.method === "POST") {
    try {
      console.log("[LOG] Memproses permintaan POST.");
      const { note, id, secret } = req.body;
      console.log("[LOG] Body permintaan:", { note: note ? 'Ada' : 'Kosong', id, secret: secret ? 'Ada' : 'Kosong' });

      // --- kalau admin mau hapus ---
      if (id && secret) {
        console.log(`[LOG] Mencoba menghapus catatan dengan ID: ${id}`);
        if (!process.env.ADMIN_PASSWORD) {
          console.error("[ERROR] Variabel lingkungan ADMIN_PASSWORD tidak diatur!");
          return res.status(500).json({ error: "Konfigurasi server error: ADMIN_PASSWORD tidak ada." });
        }

        if (secret !== process.env.ADMIN_PASSWORD) {
          console.warn("[WARN] Password admin salah.");
          return res.status(401).json({ error: "Password salah" });
        }

        try {
          await del(id);
          console.log(`[SUCCESS] Catatan dengan ID: ${id} berhasil dihapus.`);
          return res.status(200).json({ success: true });
        } catch (e) {
          console.error("[ERROR] Gagal saat memanggil Vercel Blob del():", e);
          return res.status(500).json({ error: "Gagal menghapus dari Blob Storage." });
        }
      }

      // --- kalau user submit pesan ---
      if (!note) {
        console.warn("[WARN] Permintaan ditolak karena 'note' kosong.");
        return res.status(400).json({ error: "note kosong" });
      }

      console.log("[LOG] Mencoba menyimpan catatan baru.");
      const filename = `notes/${Date.now()}.png`;
      const noteBuffer = Buffer.from(note.split(",")[1], "base64");
      console.log(`[LOG] Berhasil membuat buffer untuk file: ${filename}`);

      const blob = await put(filename, noteBuffer, {
        access: "public",
        contentType: "image/png"
      });
      console.log("[SUCCESS] Berhasil mengunggah catatan baru ke Vercel Blob:", blob.url);
      
      return res.status(201).json({ success: true, id: filename, url: blob.url });

    } catch (error) {
      console.error("[FATAL ERROR] Terjadi error tak terduga di dalam blok POST:", error);
      return res.status(500).json({ error: "Terjadi kesalahan internal pada server saat POST." });
    }
  }

  if (req.method === "GET") {
    try {
      console.log("[LOG] Memproses permintaan GET untuk mengambil semua catatan.");
      const { blobs } = await list({ prefix: "notes/" });
      console.log(`[LOG] Ditemukan ${blobs.length} catatan dari Vercel Blob.`);
      
      const notes = blobs.map(b => ({
        id: b.pathname,
        data: b.url
      }));

      console.log("[SUCCESS] Berhasil memformat data catatan.");
      return res.status(200).json({ notes: notes.reverse() });
    } catch (error) {
      console.error("[FATAL ERROR] Terjadi error tak terduga di dalam blok GET:", error);
      return res.status(500).json({ error: "Terjadi kesalahan internal pada server saat GET." });
    }
  }

  console.log(`[WARN] Metode ${req.method} tidak diizinkan.`);
  return res.status(405).end();
}
