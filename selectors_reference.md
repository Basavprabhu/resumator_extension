# Job Scraping and Injection Selectors Reference

This file documents the CSS selectors and heuristics used by the Resumator extension to detect job details and inject the "Generate Resume" button across different platforms.

## LinkedIn

### Job Details Scraping
*Source: `extension/src/scraper.ts`*

**Job Title:**
- `.job-details-jobs-unified-top-card__job-title`
- `.jobs-unified-top-card__job-title`
- `h1.t-24`
- `h1`
- `.top-card-layout__title` (Public view)

**Company Name:**
- `.job-details-jobs-unified-top-card__company-name`
- `.jobs-unified-top-card__company-name`
- `.jobs-unified-top-card__subtitle-primary-grouping a`
- `.job-details-jobs-unified-top-card__primary-description a`
- `[class*='company-name']`
- `.topcard__org-name-link` (Public view)
- `a[href*='/company/']` (Generic fallback)

**Job Description:**
- `#job-details`
- `.jobs-description__content`
- `.jobs-box__html-content`
- `.jobs-description-content__text`
- `#job-details span`
- `.description__text` (Public view)
- `div.jobs-description`
- *Heuristic*: `div` containing "About the job" with length > 200 chars.

### Apply Button Injection
*Source: `extension/src/content.tsx`*

**Target Selectors:**
- `.jobs-apply-button--top-card`
- `.jobs-s-apply`
- `.job-details-jobs-unified-top-card__container--two-pane .jobs-apply-button--top-card`

---

## Indeed

### Job Details Scraping
*Source: `extension/src/scraper.ts`*

**Job Title:**
- `.jobsearch-JobInfoHeader-title`
- `[data-testid='jobsearch-JobInfoHeader-title']`
- `h1`

**Company Name:**
- `[data-company-name='true']`
- `[data-testid='inlineHeader-companyName']`
- `.jobsearch-CompanyInfoContainer a`
- `div[class*='companyName']`

**Job Description:**
- `#jobDescriptionText`
- `.jobsearch-JobComponent-description`

### Apply Button Injection
*Source: `extension/src/content.tsx`*

**Target Selectors:**
- `[id^='indeedApplyButton']`
- `#jobsearch-ViewJobButtons-container` (Container append)
- `.jobsearch-JobInfoHeader-actions` (Container append)
- `button[aria-label*='Apply']`
- `button[contenthtml*='Apply']`
- `.jobsearch-IndeedApplyButton-newDesign`
- `#viewJobButtonLinkContainer`

---

## Naukri

### Job Details Scraping
*Source: `extension/src/scraper.ts`*

**Job Title:**
- `.jd-header-title`
- `h1.jd-header-title`
- `h1`
- `.styles_jd-header-title__rZwM1` (New UI)

**Company Name:**
- `.jd-header-comp-name a`
- `.jd-header-comp-name`
- `div.company-name`
- `.styles_jd-header-comp-name__MvqAI a` (New UI)

**Job Description:**
- `.job-desc`
- `.dang-inner-html`
- `.styles_job-desc-container__txpYf` (New UI)
- `#job-description`

### Apply Button Injection
*Source: `extension/src/content.tsx`*

**Target Selectors:**
- `#reg-apply-button` (Verified)
- `#login-apply-button` (Verified)
- `.apply-button`
- `#apply-button`
- `.styles_apply-button__w_88X`
- `.styles_reg-apply-button__lUN1u`

---

## Generic Fallbacks

### Job Details
- **Title**: `meta[property="og:title"]`, `document.title` (split by `|`, ` at `, `-`)
- **Description**: `meta[name="description"]`, `body` text (first 500 chars)

### Apply Button Injection
- **Heuristic**: Search for any `button` or `a` tag where:
    - Text includes "apply", "easy apply", "login to apply"
    - OR `aria-label` includes "apply"
    - OR `contenthtml` includes "apply"
    - AND dimensions > 50x20px
