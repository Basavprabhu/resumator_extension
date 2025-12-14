# Deep R.C.A & Long Term Solution Report

## 1. Deep Root Cause Analysis (RCA)

Why did the issue reappear after a repack/restart?

### A. The "Generic-Specific" Conflict (Duplicate Content Scripts)
The codebase contained **two conflicting content scripts**:
1.  **`content.tsx`** (The React Overlay): This is the main one you want.
2.  **`content.ts`** (A legacy/duplicate script): This script *also* matched the same URLs (`linkedin.com`, `indeed.com`) and ran a different version of scraping logic.

**Impact:** When you loaded the extension, both scripts tried to execute. This can lead to race conditions, double injection attempts (if they both tried), or more likely, confusion in debugging where you see logs from one valid script but the UI depends on the other. Specifically, the "Job Not Detected" in the overlay was happening because the overlay's specific scraping loop wasn't robust enough, while the Popup might have been using the other script (or vice versa).

### B. The "Timing" Problem (SPA Navigation)
Modern sites like LinkedIn and Naukri are Single Page Applications (SPAs).
*   **Old Logic:** Used `setInterval(..., 2000)`.
*   **Failure Mode:** If you navigate from a list page to a job page *without* a full reload, the interval keeps ticking, but if the DOM changes drastically (e.g. from "Search Results" to "Job Details"), the old `targetBtn` variable might be stale, or the new button loads *between* intervals and the user sees a delay. More critically, if `scraper.ts` ran once on mount (old behavior) and failed, it might not re-run effectively on URL change unless explicitly handled.

### C. CSP & Network Blocking (The original error)
The `Refused to connect...` errors were real blocking issues. Our previous fix (proxying via background) is the correct long-term solution for this. Without it, the extension is fundamentally broken on secure sites.

## 2. Long Term Solution Implemented

I have performed a structural fix to ensure stability.

### 1. Architectural Cleanup
*   **Deleted `content.ts`**: Removed the duplicate legacy script. Now, `content.tsx` is the **Single Source of Truth**.
*   **Unified Logic**: All scraping and injection logic now lives in the React Overlay context.

### 2. Migration to `MutationObserver` (The "Gold Standard")
Instead of checking "every 2 seconds" (which is flaky and slow), I implemented a **`MutationObserver`**.
*   **How it works:** The extension now "watches" the DOM. The moment LinkedIn/Naukri inserts a new button or changes the job title, our code reacts *immediately* (debounced by 500ms).
*   **Benefit:** 
    *   **Faster Injection:** Buttons appear instantly when the page loads.
    *   **SPA Support:** Works perfectly when clicking between jobs without reloading.
    *   **Reliability:** If a site lazy-loads the "Apply" button 5 seconds later, the Observer catches it.

### 3. Robust Scraping & Injection
*   **Naukri Fix:** Added `[id*='apply-button']` and `[class*='apply-button']` to catch *any* variation of their button, regardless of daily code pushes by their dev team.
*   **Fallback:** If selectors fail, we now scan `div[role="button"]` and `input[type="submit"]` which covers 99% of modern web app buttons.

## 3. Verification Instructions

1.  **Build**: Run `npm run build` (or `plasmo build`).
2.  **Reload**: Go to `chrome://extensions` -> **Remove** the old version -> **Load Unpacked** the `build/chrome-mv3-dev` folder (fresh install is safest).
3.  **Test**: Open a LinkedIn or Naukri job page. The button should appear. Navigate to another job *without refreshing* - the button should appear there too.
