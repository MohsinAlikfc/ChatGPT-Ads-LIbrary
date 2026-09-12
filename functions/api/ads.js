/* ═══════════════════════════════════════════════════════════════════════════
   API Route: GET /api/ads
   ═══════════════════════════════════════════════════════════════════════════ */

function escapeLike(val) {
  return String(val).replace(/[\\%_]/g, '\\$&');
}

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  const q = url.searchParams.get('q')?.trim() || '';
  const advertiser = url.searchParams.get('advertiser')?.trim() || '';
  const sort = url.searchParams.get('sort') || 'date_desc';
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 24));
  const offset = (page - 1) * limit;

  const conditions = [];
  const values = [];

  if (q) {
    const like = `%${escapeLike(q)}%`;
    conditions.push("(advertiser_name LIKE ? ESCAPE '\\' OR website_domain LIKE ? ESCAPE '\\' OR copy LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\')");
    values.push(like, like, like, like);
  }

  if (advertiser) {
    conditions.push('advertiser_slug = ?');
    values.push(advertiser);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortMap = {
    date_desc: 'published_date DESC, impressions DESC',
    date_asc: 'published_date ASC, impressions DESC',
    impressions_desc: 'impressions DESC, published_date DESC',
    impressions_asc: 'impressions ASC, published_date DESC',
  };
  const orderBy = sortMap[sort] || sortMap.date_desc;

  try {
    const [dataResult, countResult] = await Promise.all([
      env.DB.prepare(`
        SELECT id, advertiser_slug, advertiser_name, advertiser_logo,
               advertiser_page_url, website_url, website_domain, copy,
               description, media_url, published_date, impressions
        FROM ads
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `).bind(...values, limit, offset).all(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM ads ${whereClause}`).bind(...values).first(),
    ]);

    const total = countResult?.count || 0;

    return new Response(JSON.stringify({
      ads: dataResult?.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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
