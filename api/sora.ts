/**
 * MAS SORA Data serverless endpoint
 * GET /api/sora
 *
 * Pulls MAS backed overnight rates from:
 * https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
 *
 * Headers required:
 * KeyId: <MAS_KEY_ID>
 */

const MAS_DAILY_RATES_ENDPOINT =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily';

// Simple in-memory cache for serverless invocation reuse
interface CacheEntry {
  timestamp: number;
  data: any;
}
let cachedResponse: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

export default async function handler(req: any, res?: any) {
  // Set CORS headers so frontend can call this endpoint reliably
  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, KeyId, Authorization',
  };

  // Handle preflight OPTIONS request
  if (req?.method === 'OPTIONS') {
    if (res && typeof res.status === 'function') {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      return res.status(204).end();
    }
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // 1. Read API Key from environment variables (NEVER hardcoded)
  const masKeyId = (process.env.MAS_KEY_ID || process.env.MAS_API_KEY || '').trim();

  // 2. Check query string from request if any
  let queryString = '';
  if (req?.url) {
    try {
      const parsedUrl = new URL(req.url, 'http://localhost');
      queryString = parsedUrl.search;
    } catch {
      // fallback
    }
  } else if (req?.query && typeof req.query === 'object') {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === 'string') params.append(k, v);
    }
    const qs = params.toString();
    if (qs) queryString = `?${qs}`;
  }

  // Construct target MAS URL (append default limit if none specified)
  let targetUrl = `${MAS_DAILY_RATES_ENDPOINT}${queryString}`;
  if (!queryString) {
    targetUrl += '?rows=100';
  }

  // Check cache (only if no custom query and cache is fresh)
  const now = Date.now();
  if (!queryString && cachedResponse && now - cachedResponse.timestamp < CACHE_TTL_MS) {
    const responsePayload = {
      ...cachedResponse.data,
      source: 'serverless_cache',
      cachedAt: new Date(cachedResponse.timestamp).toISOString(),
    };

    if (res && typeof res.status === 'function') {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
      return res.status(200).json(responsePayload);
    }

    return new Response(JSON.stringify(responsePayload), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  }

  // Prepare outgoing headers
  const outgoingHeaders: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'SORA-Calculator-Serverless/1.0',
  };

  if (masKeyId) {
    outgoingHeaders['KeyId'] = masKeyId;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const masResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: outgoingHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!masResponse.ok) {
      const errorText = await masResponse.text();
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // text only
      }

      const errorPayload = {
        success: false,
        status: masResponse.status,
        statusText: masResponse.statusText,
        error: errorJson || errorText || 'Failed to fetch from MAS endpoint',
        hasKeyIdConfigured: Boolean(masKeyId),
        endpoint: MAS_DAILY_RATES_ENDPOINT,
        note: !masKeyId
          ? 'MAS_KEY_ID is not configured in environment variables. Set MAS_KEY_ID to authenticate.'
          : 'MAS rejected the request. Please verify that your MAS_KEY_ID has access to the domestic_interest_rates_daily resource.',
      };

      if (res && typeof res.status === 'function') {
        Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
        res.setHeader('Content-Type', 'application/json');
        return res.status(masResponse.status).json(errorPayload);
      }

      return new Response(JSON.stringify(errorPayload), {
        status: masResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rawData = await masResponse.json();

    // Cache successful response
    cachedResponse = {
      timestamp: now,
      data: rawData,
    };

    const finalPayload = {
      success: true,
      hasKeyIdConfigured: Boolean(masKeyId),
      fetchedAt: new Date().toISOString(),
      endpoint: MAS_DAILY_RATES_ENDPOINT,
      ...rawData,
    };

    if (res && typeof res.status === 'function') {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
      return res.status(200).json(finalPayload);
    }

    return new Response(JSON.stringify(finalPayload), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch (error: any) {
    const errorPayload = {
      success: false,
      error: error?.message || 'Network error connecting to MAS server',
      hasKeyIdConfigured: Boolean(masKeyId),
      endpoint: MAS_DAILY_RATES_ENDPOINT,
      timestamp: new Date().toISOString(),
    };

    if (res && typeof res.status === 'function') {
      Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));
      res.setHeader('Content-Type', 'application/json');
      return res.status(502).json(errorPayload);
    }

    return new Response(JSON.stringify(errorPayload), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Named export for Web Fetch / Next.js route handler conventions
export const GET = handler;
