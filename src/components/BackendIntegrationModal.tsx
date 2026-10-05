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
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const data = await res.json();
      setTestStatus('success');
      setTestMessage(
        `Connected successfully! Received ${Array.isArray(data?.result?.records || data) ? 'records array' : 'JSON payload'}.`
      );
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Connection failed. Verify CORS and server status.');
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
          Backend Integration & MAS API Proxy
        </div>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          The frontend is pre-wired to consume live MAS rates. When you are ready to connect your backend proxy, enter your endpoint URL below.
        </p>

        {/* Custom Proxy Input */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-5">
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Backend Proxy Endpoint URL
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
              className={`text-xs mt-2.5 p-2 rounded ${
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
            <h4 className="font-semibold text-slate-900 mb-1">Why use a backend proxy?</h4>
            <p className="leading-relaxed">
              Monetary Authority of Singapore (MAS) rates are published at 9:00 AM SGT on every business day. A backend proxy allows you to:
            </p>
            <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-600">
              <li>Cache responses to avoid MAS DataStore rate limiting</li>
              <li>Bypass browser Cross-Origin Resource Sharing (CORS) policies</li>
              <li>Optionally store daily rates in your database for custom audit trails</li>
            </ul>
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
