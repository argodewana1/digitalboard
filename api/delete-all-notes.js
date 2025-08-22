import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { secret } = request.body;

    // Security Check!
    if (secret !== process.env.ADMIN_SECRET_KEY) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    // Delete the entire list of notes.
    await kv.del('notes');
    return response.status(200).json({ success: true, message: 'All notes deleted.' });

  } catch (error) {
    console.error(error);
    return response.status(500).json({ error: 'Failed to delete notes.' });
  }
}
