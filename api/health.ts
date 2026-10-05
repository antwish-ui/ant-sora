/**
 * Health check serverless endpoint
 * GET /api/health
 */

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: {
    nodeEnv: string;
    hasMasKeyId: boolean;
  };
  masEndpointConfigured: string;
}

export default async function handler(req: any, res?: any) {
  const masKeyId = process.env.MAS_KEY_ID || process.env.MAS_API_KEY;

  const data: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime ? process.uptime() : 0),
    environment: {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasMasKeyId: Boolean(masKeyId && masKeyId.trim().length > 0),
    },
    masEndpointConfigured:
      'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily',
  };

  // Support standard Express / Node / Vercel (req, res)
  if (res && typeof res.status === 'function') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.status(200).json(data);
  }

  // Support Web Standard Response (Fetch / Edge / Cloudflare)
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

// Named export for Web Fetch / Next.js route handler conventions
export const GET = handler;
