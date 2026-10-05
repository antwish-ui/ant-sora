import React, { useState } from 'react';
import { X, Server, Check, Copy, ExternalLink, Play } from 'lucide-react';
import { getCustomProxyEndpoint, setCustomProxyEndpoint } from '../services/masApiService';

interface BackendIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEndpointSaved: () => void;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  isOpen,
  onClose,
  onEndpointSaved,
}) => {
  const [proxyUrl, setProxyUrl] = useState(getCustomProxyEndpoint());
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = () => {
    setCustomProxyEndpoint(proxyUrl);
    onEndpointSaved();
  };

  const handleTest = async () => {
    if (!proxyUrl.trim()) {
      setTestStatus('error');
      setTestMessage('Please enter an endpoint URL first.');
      return;
    }
    setTestStatus('testing');
    setTestMessage('Pinging backend endpoint...');

    try {
      const res = await fetch(proxyUrl.trim(), { method: 'GET' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          `HTTP ${res.status}: ${res.statusText}${
            errorData?.error ? ` - ${JSON.stringify(errorData.error)}` : ''
          }`
        );
      }
      const data = await res.json();
      setTestStatus('success');
      setTestMessage(
        `Connected successfully to ${proxyUrl}!\nResponse: ${JSON.stringify(data, null, 2).slice(0, 300)}...`
      );
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Connection failed. Verify server status.');
    }
  };

  const handleQuickTest = async (endpoint: string) => {
    setTestStatus('testing');
    setTestMessage(`Testing ${endpoint}...`);
    try {
      const res = await fetch(endpoint, { method: 'GET' });
      const data = await res.json().catch(() => ({ status: res.statusText }));
      if (res.ok) {
        setTestStatus('success');
        setTestMessage(
          `Connected to ${endpoint}!\nStatus: ${res.status}\nPayload: ${JSON.stringify(data, null, 2)}`
        );
      } else {
        setTestStatus('error');
        setTestMessage(
          `Received HTTP ${res.status} from ${endpoint}.\n${JSON.stringify(data, null, 2)}`
        );
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`Error contacting ${endpoint}: ${err?.message || 'Network error'}`);
    }
  };

  const expressCode = `// Express.js / Node.js backend proxy example (e.g. /server.js or /api/sora)
const express = require('express');
const app = express();

const MAS_API = 'https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=9a0bf14e-0151-4615-a477-b8d8f687169f&sort=end_of_day%20desc&limit=100';

let cachedSora = null;
let lastFetch = 0;

app.get('/api/sora', async (req, res) => {
  try {
    // Cache for 1 hour to prevent hitting MAS rate limits
    if (!cachedSora || Date.now() - lastFetch > 3600000) {
      const response = await fetch(MAS_API);
      cachedSora = await response.json();
      lastFetch = Date.now();
    }
    res.json(cachedSora);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch MAS SORA rates' });
  }
});

app.listen(3000, () => console.log('SORA proxy running on port 3000'));`;

  const pythonCode = `# Python FastAPI backend proxy example
from fastapi import FastAPI, HTTPException
import httpx
import time

app = FastAPI()
MAS_API = "https://eservices.mas.gov.sg/api/action/datastore/search.json?resource_id=9a0bf14e-0151-4615-a477-b8d8f687169f&sort=end_of_day%20desc&limit=100"

cache = {"data": None, "ts": 0}

@app.get("/api/sora")
async def get_sora_rates():
    if not cache["data"] or time.time() - cache["ts"] > 3600:
        async with httpx.AsyncClient() as client:
            resp = await client.get(MAS_API)
            if resp.status_code != 200:
                raise HTTPException(status_code=502, detail="MAS API unavailable")
            cache["data"] = resp.json()
            cache["ts"] = time.time()
    return cache["data"]`;

  const copyToClipboard = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2 text-slate-900 font-semibold text-lg">
          <Server className="w-5 h-5 text-slate-700" />
          MAS Serverless Connection (/api/sora & /api/health)
        </div>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Serverless routes are implemented in the project root <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">/api</code> directory: <code className="font-mono text-slate-800">/api/sora.ts</code> and <code className="font-mono text-slate-800">/api/health.ts</code>.
        </p>

        {/* Quick Test Bar for /api/sora & /api/health */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => {
              setProxyUrl('/api/health');
              handleQuickTest('/api/health');
            }}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors"
          >
            <div className="text-xs font-semibold text-slate-900">Test /api/health</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Check runtime status & MAS key setup</div>
          </button>
          <button
            onClick={() => {
              setProxyUrl('/api/sora');
              handleQuickTest('/api/sora');
            }}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left transition-colors"
          >
            <div className="text-xs font-semibold text-slate-900">Test /api/sora</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Query MAS daily interest rates</div>
          </button>
        </div>

        {/* Custom Proxy Input */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-5">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Active Endpoint or Custom Proxy URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. /api/sora or http://localhost:8000/api/sora"
              value={proxyUrl}
              onChange={(e) => setProxyUrl(e.target.value)}
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900"
            />
            <button
              onClick={handleTest}
              disabled={testStatus === 'testing'}
              className="flex items-center gap-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-medium transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              {testStatus === 'testing' ? 'Testing...' : 'Test'}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Save Endpoint
            </button>
          </div>

          {testMessage && (
            <div
              className={`text-xs mt-2.5 p-2 rounded whitespace-pre-wrap ${
                testStatus === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : testStatus === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {testMessage}
            </div>
          )}
        </div>

        {/* Integration Instructions */}
        <div className="space-y-4 text-xs text-slate-600">
          <div>
            <h4 className="font-semibold text-slate-900 mb-1">MAS Gateway Endpoint & Header</h4>
            <div className="p-2.5 bg-slate-100 rounded text-[11px] font-mono text-slate-800 space-y-1">
              <div><strong>Target:</strong> https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily</div>
              <div><strong>Required Header:</strong> KeyId: &lt;MAS_KEY_ID&gt;</div>
              <div><strong>Env Variable:</strong> MAS_KEY_ID (configured in .env / secrets, never hardcoded)</div>
            </div>
          </div>

          {/* Code snippet tabs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-900">Node.js / Express Proxy Code</span>
              <button
                onClick={() => copyToClipboard(expressCode, 'express')}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800"
              >
                {copiedTab === 'express' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedTab === 'express' ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed max-h-48">
              {expressCode}
            </pre>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-slate-900">Python FastAPI Proxy Code</span>
              <button
                onClick={() => copyToClipboard(pythonCode, 'python')}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800"
              >
                {copiedTab === 'python' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedTab === 'python' ? 'Copied!' : 'Copy Code'}
              </button>
            </div>
            <pre className="bg-slate-900 text-slate-200 p-3 rounded-lg overflow-x-auto text-[11px] font-mono leading-relaxed max-h-40">
              {pythonCode}
            </pre>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
