import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  try {
    // Fetch all notes. 'notes' is the key for our list in the KV store.
    // lrange(key, 0, -1) gets all items from a list.
    const notes = await kv.lrange('notes', 0, -1);
    return response.status(200).json({ notes });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'Failed to fetch notes.' });
  }
}
