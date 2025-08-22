// file: api/notes.js

import { kv } from '@vercel/kv';

export default async function handler(request, response) {
    const { method, body } = request;

    // Menggunakan variabel environment Vercel untuk koneksi
    // Pastikan REDIS_URL atau KV_... variables sudah di-set di Vercel
    if (!process.env.KV_REST_API_URL && !process.env.REDIS_URL) {
        return response.status(500).json({ error: 'Database connection is not configured.' });
    }

    switch (method) {
        // --- KASUS 1: MENGAMBIL SEMUA PESAN ---
        case 'GET':
            try {
                const noteIds = await kv.zrange('notes_sorted_set', 0, -1, { rev: true });
                if (noteIds.length === 0) {
                    return response.status(200).json({ notes: [] });
                }
                const pipeline = kv.pipeline();
                noteIds.forEach(id => pipeline.hgetall(id));
                const results = await pipeline.exec();
                const notes = noteIds.map((id, index) => ({
                    id: id,
                    data: results[index]?.data // Menambahkan ?. untuk keamanan jika data null
                }));
                return response.status(200).json({ notes });
            } catch (error) {
                console.error('API GET Error:', error);
                return response.status(500).json({ error: 'Gagal mengambil pesan.' });
            }

        // --- KASUS 2: MENAMBAH ATAU MENGHAPUS PESAN ---
        case 'POST':
            try {
                // Aksi: MENAMBAH PESAN BARU
                if (body.note) {
                    const noteId = `note:${Date.now()}`;
                    const timestamp = Date.now();
                    const pipeline = kv.pipeline();
                    pipeline.hset(noteId, { data: body.note });
                    pipeline.zadd('notes_sorted_set', { score: timestamp, member: noteId });
                    await pipeline.exec();
                    return response.status(201).json({ success: true, id: noteId });
                }
                // Aksi: MENGHAPUS PESAN
                else if (body.id && body.secret) {
                    if (body.secret !== process.env.ADMIN_SECRET_KEY) {
                        return response.status(401).json({ error: 'Unauthorized' });
                    }
                    const pipeline = kv.pipeline();
                    pipeline.zrem('notes_sorted_set', body.id);
                    pipeline.del(body.id);
                    await pipeline.exec();
                    return response.status(200).json({ success: true, message: `Pesan ${body.id} dihapus.` });
                }
                // Jika isi body tidak sesuai
                return response.status(400).json({ error: 'Permintaan tidak valid.' });
            } catch (error) {
                console.error('API POST Error:', error);
                return response.status(500).json({ error: 'Terjadi kesalahan pada server.' });
            }

        // --- JIKA METODE BUKAN GET ATAU POST ---
        default:
            response.setHeader('Allow', ['GET', 'POST']);
            return response.status(405).end(`Metode ${method} tidak diizinkan`);
    }
}
