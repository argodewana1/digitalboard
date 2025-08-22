import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.REDIS_REST_URL,
  token: process.env.REDIS_TOKEN,
});

export default async function handler(req, res) {
  const { method, body } = req;

  switch (method) {
    case "GET":
      try {
      // Ambil semua note IDs
        const noteIds = JSON.parse(await redis.get("notes_sorted_set") || "[]");
        const notes = [];
        for (const id of noteIds.reverse()) {
          const data = await redis.get(id);
          notes.push({ id, data });
        }
        return res.status(200).json({ notes });
      } catch {
        return res.status(500).json({ error: "Gagal mengambil pesan." });
      }

    case "POST":
      try {
        if (body.note) {
          const noteId = `note:${Date.now()}`;
          await redis.set(noteId, body.note);
          const noteIds = JSON.parse(await redis.get("notes_sorted_set") || "[]");
          noteIds.push(noteId);
          await redis.set("notes_sorted_set", JSON.stringify(noteIds));
          return res.status(201).json({ success: true, id: noteId });
        } else if (body.id && body.secret) {
          if (body.secret !== process.env.ADMIN_SECRET_KEY) {
            return res.status(401).json({ error: "Unauthorized" });
          }
          await redis.del(body.id);
          const noteIds = JSON.parse(await redis.get("notes_sorted_set") || "[]")
            .filter(id => id !== body.id);
          await redis.set("notes_sorted_set", JSON.stringify(noteIds));
          return res.status(200).json({ success: true, message: `Pesan ${body.id} dihapus.` });
        } else {
          return res.status(400).json({ error: "Permintaan tidak valid." });
        }
      } catch {
        return res.status(500).json({ error: "Terjadi kesalahan server." });
      }

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      return res.status(405).end(`Metode ${method} tidak diizinkan`);
  }
}
