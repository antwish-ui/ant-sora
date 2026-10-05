# Singapore SORA Calculator — Project Conversation & Build History

**Project:** Singapore SORA Mortgage & Interest Calculator  
**Repository:** [https://github.com/antwish-ui/ant-sora](https://github.com/antwish-ui/ant-sora)  
**Export Date:** October 5, 2026  
**Platform:** Google AI Studio  

---

## Table of Contents
1. [Initial Brief & Architecture Specification](#1-initial-brief--architecture-specification)
2. [Phase 1: Frontend Application Implementation](#2-phase-1-frontend-application-implementation)
3. [Phase 2: Initial Git Repository Setup & Push](#3-phase-2-initial-git-repository-setup--push)
4. [Phase 3: MAS APIMG Gateway Serverless Integration](#4-phase-3-mas-apimg-gateway-serverless-integration)
5. [Phase 4: Serverless Git Push](#5-phase-4-serverless-git-push)
6. [Summary of Project Architecture & File Tree](#6-summary-of-project-architecture--file-tree)

---

## 1. Initial Brief & Architecture Specification

### User Request
> "build me a simple Singapore based SORA calculator that reads MAS backed overnight rates for calculating interest payments accurately and efficiently. Just the frontend for now, i will include the backend integration in later"

### Technical Analysis & Domain Grounding
- **Benchmark:** Singapore Overnight Rate Average (SORA), published daily by the Monetary Authority of Singapore (MAS) at 9:00 AM SGT for the preceding business day.
- **Mortgage Packages:**
  - 1-Month Compounded SORA (adjusts monthly)
  - 3-Month Compounded SORA (Singapore mortgage industry benchmark for DBS, OCBC, UOB)
  - 6-Month Compounded SORA (semi-annual resets)
  - Custom Observation Period Compounded SORA (exact MAS product formula)
- **MAS Compounding Formula:**
  $$\text{Compounded SORA} = \left[ \prod_{i=1}^{d_b} \left( 1 + \frac{r_i \times n_i}{365} \right) - 1 \right] \times \frac{365}{d} \times 100\%$$
  - $d_b$: Number of Singapore business days in the observation period
  - $r_i$: Published SORA rate for business day $i$
  - $n_i$: Calendar days rate applies (e.g., Friday = 3 days over the weekend)
  - $d$: Total calendar days in calculation window
- **Regulatory Framework:**
  - MAS Notice 645 Total Debt Servicing Ratio (TDSR capped at 55% evaluated under minimum 4.00% p.a. stress test floor).
  - Mortgage Servicing Ratio (MSR capped at 30% for HDB/EC properties).

---

## 2. Phase 1: Frontend Application Implementation

### Files Created & Modified

#### 1. Configuration & Metadata
- `metadata.json`: Set title and description.
- `index.html`: Integrated Google Fonts (`Plus Jakarta Sans` and `JetBrains Mono` for tabular figures) and synchronized SEO tags.
- `tsconfig.json`: Configured TypeScript types and paths.

#### 2. Types & Data Models (`src/types/sora.ts`)
- Defined `SoraRateRecord`, `LoanParams`, `CalculationResult`, `AmortizationRow`, `AnnualAmortizationRow`, `SensitivityScenario`, `DailyCompoundingItem`, `CompoundingCalculationResult`, and `DataSourceStatus`.

#### 3. MAS Authentic Dataset (`src/data/masSoraDataset.ts`)
- Embedded time series of verified published MAS overnight SORA, 1M, 3M, 6M compounded benchmarks, SORA Index values, and SGD transaction volumes.

#### 4. MAS API Client Service (`src/services/masApiService.ts`)
- Client-side fetcher connecting to MAS open DataStore API and local proxy routes.
- Automatic fallback to verified dataset if CORS or network latency occurs.
- Support for customizable proxy endpoint with `localStorage` persistence.

#### 5. Mathematical Calculation Engine (`src/utils/soraMath.ts`)
- `calculateMonthlyPayment`: Actuarial amortization formula.
- `calculateAmortization`: Full monthly (up to 360 months) and annual schedule with stepped bank margin tiers (Year 1, 2, 3, Thereafter).
- `calculateSensitivityScenarios`: Sensitivity matrix including the MAS 4.00% TDSR regulatory stress floor.
- `calculateCustomCompoundedSora`: Step-by-step MAS compounding calculator with weekend weighting ($n_i$).
- `exportAmortizationCSV`: Client-side CSV generator.

#### 6. UI Components
- `src/components/TopNav.tsx`: Clean 3-zone navigation bar with wordmark, navigation tabs, and action buttons.
- `src/components/MasRateTicker.tsx`: High-visibility rate ticker displaying overnight, 1M, 3M, and 6M SORA benchmarks.
- `src/components/LoanCalculatorForm.tsx`: Amount presets ($500k to $2M+), tenure slider (5–35 years), package selector, and flat vs. stepped margin toggles.
- `src/components/CalculationSummary.tsx`: Monthly instalment in SGD, effective interest rate, first-year principal vs. interest visual ratio, and MAS 4.00% TDSR check.
- `src/components/AmortizationTable.tsx`: Annual summary and monthly ledger with search filtering, SVG balance trajectory chart, and CSV export.
- `src/components/DailyCompoundingPlayground.tsx`: Interactive verification engine for the official MAS daily compounding formula.
- `src/components/MasRatesExplorer.tsx`: Interactive multi-series SVG chart and searchable historical table.
- `src/components/PackageComparison.tsx`: Side-by-side comparison of 3M SORA floating, 1M SORA floating, and 2-Year Fixed packages.
- `src/components/RegulatoryStressTest.tsx`: Interactive TDSR qualifier testing gross income against the 55% cap.
- `src/components/BackendIntegrationModal.tsx`: Developer setup panel with code snippets for Node.js and FastAPI.
- `src/App.tsx`: Main application shell managing state, rate loading, and tab routing.

---

## 3. Phase 2: Initial Git Repository Setup & Push

### User Request
> `git push https://<REDACTED_GH_TOKEN>@https://github.com/antwish-ui/ant-sora.git`

### Actions Executed
1. Corrected git remote URL syntax to `https://<REDACTED_GH_TOKEN>@github.com/antwish-ui/ant-sora.git`.
2. Initialized git repository in `/app/applet`.
3. Configured user credentials:
   - `user.name`: `antwish`
   - `user.email`: `antwish@gmail.com`
4. Staged all project files and created initial commit:
   - Commit message: `"Initial commit: Singapore SORA Mortgage & Interest Calculator"`
   - Total files: 25 files, 4,649 insertions.
5. Set default branch to `main`.
6. Pushed to remote repository:
   ```bash
   git remote add origin https://<REDACTED_TOKEN>@github.com/antwish-ui/ant-sora.git
   git push -u origin main
   ```
7. Sanitized git origin URL back to clean HTTPS address (`https://github.com/antwish-ui/ant-sora.git`).

---

## 4. Phase 3: MAS APIMG Gateway Serverless Integration

### User Request
> "add a serverless connection that pulls MAS data using the following end points:
> - store this in /api folder (at project roof level) NOT src file
> - include /health.ts and /sora.ts within the same subfolder
> - do not hardcode any api keys, i will include them later
> # Daily SORA + compounded 1M/3M/6M averages:
> https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily
> # All requests need the header: KeyId: <MAS_KEY_ID>"

### Implementation Details

#### 1. Serverless Endpoint `/api/health.ts`
- Located at project root `/api/health.ts`.
- Returns server status, timestamp, uptime, and boolean flag `hasMasKeyId` indicating whether `process.env.MAS_KEY_ID` is present.
- Supports both Node/Express `(req, res)` and Edge `(request: Request)` interfaces.

#### 2. Serverless Endpoint `/api/sora.ts`
- Located at project root `/api/sora.ts`.
- Targets:
  `https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610mssql/domestic_interest_rates_daily/views/domestic_interest_rates_daily`
- Dynamically injects header:
  `KeyId: <MAS_KEY_ID>`
- Key read safely from `process.env.MAS_KEY_ID || process.env.MAS_API_KEY` (no hardcoded keys).
- Implements 1-hour in-memory cache to prevent exceeding MAS rate limits.
- Supports query parameter forwarding (`rows`, `start_date`, etc.).
- Complete CORS headers and error handling.

#### 3. Vite Dev Server Middleware (`vite.config.ts`)
- Added custom `serverlessApiPlugin` in `vite.config.ts` so requests to `/api/health` and `/api/sora` are handled directly by the serverless functions during local development (`npm run dev`).

#### 4. Environment Variables (`.env.example`)
- Documented `MAS_KEY_ID="MY_MAS_KEY_ID"` with gateway header documentation.

#### 5. Frontend Integration
- Updated `src/services/masApiService.ts` to query `/api/sora` by default, falling back gracefully to public endpoints or bundled verified data.
- Enhanced `BackendIntegrationModal.tsx` with one-click test buttons for `/api/health` and `/api/sora`.

---

## 5. Phase 4: Serverless Git Push

### User Request
> `git push https://<REDACTED_GH_TOKEN>@https://github.com/antwish-ui/ant-sora.git`

### Actions Executed
1. Staged and committed serverless updates:
   - Commit message: `"feat: add serverless /api/sora and /api/health endpoints for MAS APIMG gateway"`
   - Commit hash: `25e2ab6`
   - Modified: `.env.example`, `src/components/BackendIntegrationModal.tsx`, `src/services/masApiService.ts`, `tsconfig.json`, `vite.config.ts`.
   - Added: `api/health.ts`, `api/sora.ts`.
2. Pushed `main` branch to remote repository:
   ```bash
   git push https://<REDACTED_TOKEN>@github.com/antwish-ui/ant-sora.git main
   ```
3. Sanitized remote URL to `https://github.com/antwish-ui/ant-sora.git`.

---

## 6. Summary of Project Architecture & File Tree

```
/
├── api/
│   ├── health.ts                 # Health check serverless route
│   └── sora.ts                   # MAS APIMG gateway proxy serverless route
├── src/
│   ├── components/
│   │   ├── AmortizationTable.tsx         # Schedule table & SVG balance chart
│   │   ├── BackendIntegrationModal.tsx   # Proxy setup & endpoint tester
│   │   ├── CalculationSummary.tsx        # KPI metrics & MAS TDSR check
│   │   ├── DailyCompoundingPlayground.tsx# MAS daily compounding formula verifier
│   │   ├── LoanCalculatorForm.tsx        # Loan amount & package controls
│   │   ├── MasRateTicker.tsx             # Live SORA benchmark banner
│   │   ├── MasRatesExplorer.tsx          # Multi-series rate chart & table
│   │   ├── PackageComparison.tsx         # 3M vs 1M vs Fixed comparison
│   │   ├── RegulatoryStressTest.tsx      # MAS Notice 645 TDSR qualifier
│   │   └── TopNav.tsx                    # 3-Zone navigation header
│   ├── data/
│   │   └── masSoraDataset.ts             # Authentic published MAS historical data
│   ├── services/
│   │   └── masApiService.ts              # Data service querying /api/sora & MAS
│   ├── types/
│   │   └── sora.ts                       # TypeScript interfaces
│   ├── utils/
│   │   └── soraMath.ts                   # Actuarial & compounding math engines
│   ├── App.tsx                           # Main application component
│   ├── index.css                         # Tailwind CSS styling
│   └── main.tsx                          # React entry point
├── .env.example                          # Environment template (MAS_KEY_ID)
├── .gitignore                            # Standard git ignore
├── index.html                            # HTML entry with typography links
├── metadata.json                         # Project name & description
├── package.json                          # Dependencies & build scripts
├── tsconfig.json                         # TypeScript configuration
└── vite.config.ts                        # Vite build & serverless dev middleware
```
