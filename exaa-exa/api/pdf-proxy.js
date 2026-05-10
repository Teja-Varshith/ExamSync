/**
 * Vercel Serverless Function — PDF Proxy
 *
 * Fetches a PDF from any external URL server-side (bypassing CORS)
 * and streams it back to the client with proper headers.
 *
 * Usage: /api/pdf-proxy?url=<encoded-pdf-url>
 */
export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing "url" query parameter' });
  }

  try {
    const pdfResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ExamSync/1.0)',
      },
    });

    if (!pdfResponse.ok) {
      return res.status(pdfResponse.status).json({
        error: `Upstream returned ${pdfResponse.status}`,
      });
    }

    const buffer = await pdfResponse.arrayBuffer();

    // Set CORS + caching headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('Content-Length', buffer.byteLength);

    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    console.error('PDF proxy error:', err);
    return res.status(500).json({ error: 'Failed to fetch PDF' });
  }
}
