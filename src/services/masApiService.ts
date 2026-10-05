import { SoraRateRecord, DataSourceStatus } from '../types/sora';
import { FALLBACK_MAS_SORA_DATA } from '../data/masSoraDataset';

// Official MAS DataStore API resource for SORA / Domestic Interest Rates
const MAS_API_ENDPOINT =
  'https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=9a0bf14e-0151-4615-a477-b8d8f687169f&sort=end_of_day%20desc&limit=100';

const LOCAL_STORAGE_PROXY_KEY = 'mas_sora_proxy_endpoint';

export interface MasApiResponseRecord {
  end_of_day?: string;
  sora?: string | number;
  sora_compounded_1m?: string | number;
  sora_compounded_3m?: string | number;
  sora_compounded_6m?: string | number;
  sora_index?: string | number;
  aggregate_volume?: string | number;
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

export async function fetchMasSoraRates(): Promise<{
  records: SoraRateRecord[];
  status: DataSourceStatus;
}> {
  const proxyEndpoint = getCustomProxyEndpoint();
  const endpoint = proxyEndpoint || MAS_API_ENDPOINT;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`MAS API returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check if it's MAS DataStore format or custom backend format
    let rawRecords: MasApiResponseRecord[] = [];
    if (data?.result?.records && Array.isArray(data.result.records)) {
      rawRecords = data.result.records;
    } else if (Array.isArray(data)) {
      rawRecords = data;
    } else if (data?.records && Array.isArray(data.records)) {
      rawRecords = data.records;
    }

    if (rawRecords.length === 0) {
      throw new Error('No records returned from endpoint');
    }

    const parsed: SoraRateRecord[] = rawRecords
      .map((r) => {
        const date = r.end_of_day || '';
        const sora = parseFloat(String(r.sora || '0'));
        const soraCompounded1m = parseFloat(String(r.sora_compounded_1m || '0'));
        const soraCompounded3m = parseFloat(String(r.sora_compounded_3m || '0'));
        const soraCompounded6m = parseFloat(String(r.sora_compounded_6m || '0'));
        const soraIndex = parseFloat(String(r.sora_index || '0'));
        const volumeSgdMillion = parseFloat(String(r.aggregate_volume || '0'));

        return {
          date,
          sora: isNaN(sora) ? 0 : sora,
          soraCompounded1m: isNaN(soraCompounded1m) ? 0 : soraCompounded1m,
          soraCompounded3m: isNaN(soraCompounded3m) ? 0 : soraCompounded3m,
          soraCompounded6m: isNaN(soraCompounded6m) ? 0 : soraCompounded6m,
          soraIndex: isNaN(soraIndex) ? 1.0 : soraIndex,
          volumeSgdMillion: isNaN(volumeSgdMillion) ? undefined : volumeSgdMillion,
        };
      })
      .filter((r) => r.date && r.sora > 0);

    if (parsed.length > 0) {
      return {
        records: parsed,
        status: {
          source: proxyEndpoint ? 'custom_proxy' : 'live_mas_api',
          lastUpdated: new Date().toLocaleTimeString('en-SG', { hour12: false }),
          recordCount: parsed.length,
          isLoading: false,
          proxyEndpoint: proxyEndpoint || undefined,
        },
      };
    }

    throw new Error('Could not parse valid SORA records from response');
  } catch (error: any) {
    // Expected in pure client sandbox if MAS API lacks open CORS or network timeout occurs
    return {
      records: FALLBACK_MAS_SORA_DATA,
      status: {
        source: 'cached_mas_dataset',
        lastUpdated: '09:00:00 SGT (MAS Published)',
        recordCount: FALLBACK_MAS_SORA_DATA.length,
        isLoading: false,
        error: error?.message || 'MAS direct connection restricted; using official verified dataset',
        proxyEndpoint: proxyEndpoint || undefined,
      },
    };
  }
}
