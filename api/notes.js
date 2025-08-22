import { put, list, del } from "@vercel/blob";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { note, id, secret } = req.body;

    // --- kalau admin mau hapus ---
    if (id && secret) {
      if (secret !== process.env.ADMIN_PASSWORD) {
        return res.status(401).json({ error: "Password salah" });
      }
      try {
        await del(id);
        return res.status(200).json({ success: true });
      } catch (e) {
        return res.status(500).json({ error: "Gagal hapus" });
      }
    }

    // --- kalau user submit pesan ---
    if (!note) return res.status(400).json({ error: "note kosong" });

    const filename = `notes/${Date.now()}.png`;
    const blob = await put(filename, Buffer.from(note.split(",")[1], "base64"), {
      access: "public",
      contentType: "image/png"
    });

    return res.status(201).json({ success: true, id: filename, url: blob.url });
  }

  if (req.method === "GET") {
    const { blobs } = await list({ prefix: "notes/" });
    const notes = blobs.map(b => ({
      id: b.pathname,
      data: b.url
    }));

    return res.status(200).json({ notes: notes.reverse() });
  }

  return res.status(405).end();
}
