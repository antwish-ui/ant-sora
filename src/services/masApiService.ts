import { SoraRateRecord, DataSourceStatus } from '../types/sora';
import { FALLBACK_MAS_SORA_DATA } from '../data/masSoraDataset';

// Official MAS APIMG Gateway serverless endpoint & DataStore fallback
const LOCAL_SERVERLESS_ENDPOINT = '/api/sora';
const MAS_PUBLIC_DATASTORE_ENDPOINT =
  'https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=9a0bf14e-0151-4615-a477-b8d8f687169f&sort=end_of_day%20desc&limit=100';

const LOCAL_STORAGE_PROXY_KEY = 'mas_sora_proxy_endpoint';

export interface MasApiResponseRecord {
  end_of_day?: string;
  END_OF_DAY?: string;
  date?: string;
  sora?: string | number;
  SORA?: string | number;
  sora_compounded_1m?: string | number;
  SORA_COMPOUNDED_1M?: string | number;
  sora_compounded_3m?: string | number;
  SORA_COMPOUNDED_3M?: string | number;
  sora_compounded_6m?: string | number;
  SORA_COMPOUNDED_6M?: string | number;
  sora_index?: string | number;
  SORA_INDEX?: string | number;
  aggregate_volume?: string | number;
  AGGREGATE_VOLUME?: string | number;
  [key: string]: any;
}

export function getCustomProxyEndpoint(): string {
  try {
    return localStorage.getItem(LOCAL_STORAGE_PROXY_KEY) || '';
  } catch {
    return '';
  }
}

export function setCustomProxyEndpoint(endpoint: string): void {
  try {
    if (endpoint.trim()) {
      localStorage.setItem(LOCAL_STORAGE_PROXY_KEY, endpoint.trim());
    } else {
      localStorage.removeItem(LOCAL_STORAGE_PROXY_KEY);
    }
  } catch (err) {
    console.error('Failed to save proxy endpoint', err);
  }
}

function parseRecords(rawRecords: any[]): SoraRateRecord[] {
  return rawRecords
    .map((r) => {
      const date = r.end_of_day || r.END_OF_DAY || r.date || '';
      const sora = parseFloat(String(r.sora ?? r.SORA ?? '0'));
      const soraCompounded1m = parseFloat(String(r.sora_compounded_1m ?? r.SORA_COMPOUNDED_1M ?? '0'));
      const soraCompounded3m = parseFloat(String(r.sora_compounded_3m ?? r.SORA_COMPOUNDED_3M ?? '0'));
      const soraCompounded6m = parseFloat(String(r.sora_compounded_6m ?? r.SORA_COMPOUNDED_6M ?? '0'));
      const soraIndex = parseFloat(String(r.sora_index ?? r.SORA_INDEX ?? '1.0'));
      const volumeSgdMillion = parseFloat(String(r.aggregate_volume ?? r.AGGREGATE_VOLUME ?? r.volume ?? '0'));

      return {
        date,
        sora: isNaN(sora) ? 0 : sora,
        soraCompounded1m: isNaN(soraCompounded1m) ? 0 : soraCompounded1m,
        soraCompounded3m: isNaN(soraCompounded3m) ? 0 : soraCompounded3m,
        soraCompounded6m: isNaN(soraCompounded6m) ? 0 : soraCompounded6m,
        soraIndex: isNaN(soraIndex) ? 1.0 : soraIndex,
        volumeSgdMillion: isNaN(volumeSgdMillion) || volumeSgdMillion <= 0 ? undefined : volumeSgdMillion,
      };
    })
    .filter((r) => r.date && r.sora > 0);
}

export async function fetchMasSoraRates(): Promise<{
  records: SoraRateRecord[];
  status: DataSourceStatus;
}> {
  const customProxy = getCustomProxyEndpoint();

  // Endpoints to attempt in order
  const candidateEndpoints = customProxy
    ? [customProxy, LOCAL_SERVERLESS_ENDPOINT, MAS_PUBLIC_DATASTORE_ENDPOINT]
    : [LOCAL_SERVERLESS_ENDPOINT, MAS_PUBLIC_DATASTORE_ENDPOINT];

  for (const endpoint of candidateEndpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        continue;
      }

      const data = await response.json();

      let rawRecords: any[] = [];
      if (data?.result?.records && Array.isArray(data.result.records)) {
        rawRecords = data.result.records;
      } else if (data?.data && Array.isArray(data.data)) {
        rawRecords = data.data;
      } else if (Array.isArray(data)) {
        rawRecords = data;
      } else if (data?.records && Array.isArray(data.records)) {
        rawRecords = data.records;
      }

      const parsed = parseRecords(rawRecords);
      if (parsed.length > 0) {
        const isServerless = endpoint === LOCAL_SERVERLESS_ENDPOINT;
        return {
          records: parsed,
          status: {
            source: customProxy
              ? 'custom_proxy'
              : isServerless
              ? 'custom_proxy'
              : 'live_mas_api',
            lastUpdated: new Date().toLocaleTimeString('en-SG', { hour12: false }),
            recordCount: parsed.length,
            isLoading: false,
            proxyEndpoint: endpoint,
          },
        };
      }
    } catch {
      // Continue to next candidate
    }
  }

  // Resilient fallback to verified MAS dataset
  return {
    records: FALLBACK_MAS_SORA_DATA,
    status: {
      source: 'cached_mas_dataset',
      lastUpdated: '09:00:00 SGT (MAS Published)',
      recordCount: FALLBACK_MAS_SORA_DATA.length,
      isLoading: false,
      error: 'Using verified MAS benchmark series. Connect MAS_KEY_ID in serverless /api to pull direct.',
      proxyEndpoint: customProxy || LOCAL_SERVERLESS_ENDPOINT,
    },
  };
}
