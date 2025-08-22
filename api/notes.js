import { put, list, del } from "@vercel/blob";

export default async function handler(req, res) {
  // Menangani permintaan POST untuk membuat atau menghapus catatan
  if (req.method === "POST") {
    const { note, id, secret } = req.body;

    // Logika untuk admin menghapus catatan
    if (id && secret) {
      // Periksa apakah kata sandi admin benar
      if (secret !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Password salah" });
      }
      try {
        // Hapus blob dari Vercel
        await del(id);
        return res.status(200).json({ success: true });
      } catch (e) {
        return res.status(500).json({ error: "Gagal menghapus catatan" });
      }
    }

    // Logika untuk user mengirimkan catatan
    if (!note) {
      return res.status(400).json({ error: "Catatan kosong" });
    }

    // Menyiapkan nama file dan mengunggah ke Vercel Blob
    const filename = `notes/${Date.now()}.png`;
    const blob = await put(filename, Buffer.from(note.split(",")[1], "base64"), {
      access: "public",
      contentType: "image/png"
    });

    // Mengembalikan respons sukses dengan URL blob
    return res.status(201).json({ success: true, id: filename, url: blob.url });
  }

  // Menangani permintaan GET untuk mengambil semua catatan
  if (req.method === "GET") {
    // Mendapatkan daftar blob dari folder 'notes'
    const { blobs } = await list({ prefix: "notes/" });
    const notes = blobs.map(b => ({
      id: b.pathname,
      data: b.url
    }));

    // Mengembalikan daftar catatan dalam urutan terbalik (terbaru dulu)
    return res.status(200).json({ notes: notes.reverse() });
  }

  // Menangani metode permintaan lain yang tidak didukung
  return res.status(405).end();
}
