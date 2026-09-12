/* ═══════════════════════════════════════════════════════════════════════════
   API Route: GET /api/stats
   ═══════════════════════════════════════════════════════════════════════════ */

export async function onRequest(context) {
  const { env } = context;

  try {
    const [adsCount, advCount, impressionsResult, dateResult, topAdv] = await Promise.all([
      env.DB.prepare('SELECT COUNT(*) as count FROM ads').first(),
      env.DB.prepare('SELECT COUNT(*) as count FROM advertisers').first(),
      env.DB.prepare('SELECT SUM(impressions) as total FROM ads').first(),
      env.DB.prepare('SELECT MIN(published_date) as minDate, MAX(published_date) as maxDate FROM ads').first(),
      env.DB.prepare('SELECT * FROM advertisers ORDER BY total_impressions DESC LIMIT 10').all(),
    ]);

    return new Response(JSON.stringify({
      totalAds: adsCount?.count || 0,
      totalAdvertisers: advCount?.count || 0,
      totalImpressions: impressionsResult?.total || 0,
      minDate: dateResult?.minDate || null,
      maxDate: dateResult?.maxDate || null,
      topAdvertisers: topAdv?.results || [],
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60, s-maxage=3600',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
