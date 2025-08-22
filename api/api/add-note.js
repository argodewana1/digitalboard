import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { note } = request.body;
    if (!note) {
      return response.status(400).json({ error: 'Note content is required.' });
    }

    // Add the new note to the beginning of the list.
    await kv.lpush('notes', note);
    return response.status(201).json({ success: true });
  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'Failed to save note.' });
  }
}
