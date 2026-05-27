# Finance Tracker

GitHub-backed personal finance tracker. Static React app, no traditional backend. Same architecture as roadmap-tracker.

## Features

- Income, expenses, donations logging
- Automatic 25% donation pledge tracking against income
- Per-category monthly budgets with color-coded progress
- Payment method tracking (cash + configurable cards)
- Recurring expense templates with confirm-on-load prompts
- YTD and MTD reporting
- PWA installable on mobile

## Architecture

Identical to roadmap-tracker:

- App repo (public): React + Vite + Tailwind, deployed to GitHub Pages
- Data repo (private): JSON files written via Contents API
- Auth: Fine-Grained PAT, stored only in browser localStorage
- Concurrency: SHA-based optimistic locking
- Data files: `data/settings.json`, `data/income.json`, `data/expenses.json`, `data/donations.json`

## Setup

### 1. Create both repos

- `finance-tracker` (public, empty)
- `finance-tracker-data` (private, empty)

### 2. Generate Fine-Grained PAT

https://github.com/settings/personal-access-tokens/new

- Name: `finance-tracker-data-rw`
- Expiration: 90 days
- Repository access: Only selected repositories → `finance-tracker-data` only
- Permissions → Repository → Contents: Read and write

### 3. Push the code

```powershell
cd finance-tracker
npm install
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/princesavsaviya/finance-tracker.git
git push -u origin main
```

The `npm install` step generates `package-lock.json` which the GH Action needs for `npm ci`.

### 4. Enable GitHub Pages

In the `finance-tracker` repo:
- Settings → Pages → Source: **GitHub Actions**

Wait ~90 seconds for the deploy workflow.

### 5. Open the live app

URL: `https://princesavsaviya.github.io/finance-tracker/`

First run: setup modal appears. Paste PAT, confirm owner and repo, connect.

## Default donation rate

25% of all income, computed automatically per income entry. Change in **Settings → Donation Rate** if needed. Pledge running total = sum(income) * rate. Outstanding = pledged YTD - donated YTD.

## Default expense categories

Rent, Groceries, Transport, Eating Out, Subscriptions, Phone, Utilities, Health, Education, Travel, Gifts/Family, Misc. Stored in `settings.json` but not currently editable in the UI (v2 feature).

## Cards

Configure in **Settings → Cards**. Each card has a name and optional last 4 digits. Once added, they appear as payment method options when logging expenses.

## Recurring expenses

Configure templates in **Settings → Recurring Expenses**. Each template has:
- Name (e.g., "Rent")
- Amount
- Category
- Payment method
- Day of month (1-28)

On the day of month or later, if the expense hasn't been logged for the current month, a banner appears on the Dashboard with **Log** and **Skip** buttons. **Log** creates the expense entry. **Skip** dismisses for this month (won't prompt again until next month).

This is intentionally not silent auto-create. Safer this way.

## Data files

| File | Contains |
|---|---|
| `data/settings.json` | Donation rate, cards, categories, budgets, recurring templates |
| `data/income.json` | All income entries |
| `data/expenses.json` | All expense entries |
| `data/donations.json` | All donation entries |

## Local development

```powershell
npm install
npm run dev
```

Runs at `http://localhost:5173/finance-tracker/`.

## Backup

Clone the data repo locally and `git pull` periodically:

```bash
git clone git@github.com:princesavsaviya/finance-tracker-data.git
```

The git history is your audit log. Every change creates a commit.

## Privacy

Finance data is more sensitive than roadmap data. The PAT is scoped to a single private repo. Browser localStorage holds the PAT. If your device is compromised, revoke immediately at https://github.com/settings/personal-access-tokens

Set a 90-day calendar reminder to rotate the PAT.

## Renaming the repo

If you don't use `finance-tracker` as the app repo name, update:

1. `vite.config.js` → `base: '/your-new-name/'`
2. `index.html` → all `/finance-tracker/` paths
3. `public/manifest.json` → `start_url` and `scope`
4. `public/sw.js` → `APP_SHELL` paths

## What's not in v1

These are deliberately deferred:

- Editing expense categories or income sources in UI (must edit `settings.json` directly for now)
- Multi-currency
- Auto-recurring without confirmation
- Reports tab with charts and historical comparisons
- Export to CSV
- Budget rollover (unused budget carries to next month)
- Income source taxonomy beyond default list

Ask when you want any of these added.
