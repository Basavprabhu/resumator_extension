export const scrapePage = () => {
    const url = window.location.href
    let jobData = {
        title: "",
        company: "",
        description: "",
        url: url,
        platform: "unknown",
        debug_info: [] as string[]
    }

    const log = (msg: string) => jobData.debug_info.push(msg)

    try {
        // LinkedIn
        if (url.includes("linkedin.com")) {
            jobData.platform = "linkedin"
            log("Detecting LinkedIn...")

            // Title
            const titleSelectors = [
                ".job-details-jobs-unified-top-card__job-title",
                ".jobs-unified-top-card__job-title",
                "h1.t-24",
                "h1",
                ".top-card-layout__title" // Public job view
            ]
            for (const sel of titleSelectors) {
                const el = document.querySelector(sel)
                if (el && el.textContent?.trim()) {
                    jobData.title = el.textContent.trim()
                    log(`Found title with ${sel}`)
                    break
                }
            }

            // Company
            const companySelectors = [
                ".job-details-jobs-unified-top-card__company-name",
                ".jobs-unified-top-card__company-name",
                ".jobs-unified-top-card__subtitle-primary-grouping a",
                ".job-details-jobs-unified-top-card__primary-description a",
                "[class*='company-name']",
                ".topcard__org-name-link", // Public job view
                // Generic: Find the first link that goes to a company page
                "a[href*='/company/']"
            ]
            for (const sel of companySelectors) {
                const el = document.querySelector(sel)
                if (el && el.textContent?.trim()) {
                    // Avoid links that are just images or icons
                    if (el.textContent.trim().length > 1) {
                        jobData.company = el.textContent.trim()
                        log(`Found company with ${sel}`)
                        break
                    }
                }
            }

            // Description
            const descSelectors = [
                "#job-details",
                ".jobs-description__content",
                ".jobs-box__html-content",
                ".jobs-description-content__text",
                "#job-details span",
                ".description__text", // Public job view
                // Generic: Look for the container that has "About the job"
                "div.jobs-description"
            ]

            // Heuristic: If we can't find by class, look for the largest text block containing "About the job"
            if (!document.querySelector(descSelectors.join(","))) {
                const allDivs = document.querySelectorAll("div")
                for (const div of Array.from(allDivs)) {
                    if (div.textContent?.includes("About the job") && div.textContent.length > 200) {
                        jobData.description = div.textContent.trim()
                        log("Found desc via heuristic 'About the job'")
                        break
                    }
                }
            }

            for (const sel of descSelectors) {
                const el = document.querySelector(sel) as HTMLElement
                if (el && el.innerText?.trim()) {
                    let text = el.innerText.trim()
                    text = text.replace(/^About the job\s*/i, "")
                    if (text.length > 50) { // Threshold to avoid empty containers
                        jobData.description = text
                        log(`Found desc with ${sel} (len: ${text.length})`)
                        break
                    }
                }
            }
        }
        // Indeed
        else if (url.includes("indeed.com")) {
            jobData.platform = "indeed"
            log("Detecting Indeed...")

            // Title
            const titleSelectors = [
                ".jobsearch-JobInfoHeader-title",
                "[data-testid='jobsearch-JobInfoHeader-title']",
                "h1"
            ]
            for (const sel of titleSelectors) {
                const el = document.querySelector(sel)
                if (el && el.textContent?.trim()) {
                    jobData.title = el.textContent.trim()
                    log(`Found title with ${sel}`)
                    break
                }
            }

            // Company
            const companySelectors = [
                "[data-company-name='true']",
                "[data-testid='inlineHeader-companyName']",
                ".jobsearch-CompanyInfoContainer a",
                "div[class*='companyName']"
            ]
            for (const sel of companySelectors) {
                const el = document.querySelector(sel)
                if (el && el.textContent?.trim()) {
                    jobData.company = el.textContent.trim()
                    log(`Found company with ${sel}`)
                    break
                }
            }

            // Description
            const descSelectors = [
                "#jobDescriptionText",
                ".jobsearch-JobComponent-description"
            ]
            for (const sel of descSelectors) {
                const el = document.querySelector(sel) as HTMLElement
                if (el && el.innerText?.trim()) {
                    jobData.description = el.innerText.trim()
                    log(`Found desc with ${sel} (len: ${jobData.description.length})`)
                    break
                }
            }
        }
        // Naukri
        else if (url.includes("naukri.com")) {
            jobData.platform = "naukri"
            log("Detecting Naukri...")

            // Title
            const titleSelectors = [
                ".jd-header-title",
                "h1.jd-header-title",
                "h1",
                ".styles_jd-header-title__rZwM1" // New Naukri
            ]
            for (const sel of titleSelectors) {
                const el = document.querySelector(sel)
                if (el && el.textContent?.trim()) {
                    jobData.title = el.textContent.trim()
                    log(`Found title with ${sel}`)
                    break
                }
            }

            // Company
            const companySelectors = [
                ".jd-header-comp-name a",
                ".jd-header-comp-name",
                "div.company-name",
                ".styles_jd-header-comp-name__MvqAI a" // New Naukri
            ]
            for (const sel of companySelectors) {
                const el = document.querySelector(sel)
                if (el && el.textContent?.trim()) {
                    jobData.company = el.textContent.trim()
                    log(`Found company with ${sel}`)
                    break
                }
            }

            // Description
            const descSelectors = [
                ".job-desc",
                ".dang-inner-html",
                ".styles_job-desc-container__txpYf", // New Naukri
                "#job-description"
            ]
            for (const sel of descSelectors) {
                const el = document.querySelector(sel) as HTMLElement
                if (el && el.innerText?.trim()) {
                    jobData.description = el.innerText.trim()
                    log(`Found desc with ${sel}`)
                    break
                }
            }
        }
        // Generic Fallback
        else {
            log("Using generic fallback")
            const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content")
            const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute("content")

            jobData.title = ogTitle || document.title || ""
            jobData.description = metaDesc || document.body.innerText.slice(0, 500) || ""
        }
    } catch (e: any) {
        console.error("Scraping error:", e)
        log(`Error: ${e.message}`)
    }

    // Final Fallback for Title if still empty (Common for all platforms)
    // Final Fallback for Title/Company if still empty (Common for all platforms)
    if (!jobData.title) {
        // Try document title
        const docTitle = document.title
        if (docTitle) {
            // Heuristic: "Job Title at Company" or "Job Title | Company" or "Job Title - Company"
            // Most sites follow: Title | Company | Location OR Title - Company - Location
            const splitters = [" | ", " at ", " - ", " – "]

            for (const s of splitters) {
                if (docTitle.includes(s)) {
                    const parts = docTitle.split(s)
                    jobData.title = parts[0].trim()

                    // If we haven't found a company yet, try the second part
                    if (!jobData.company && parts.length > 1) {
                        // Often the second part is the company
                        // But sometimes it might be "Job Title - Location - Company"
                        // We'll take the second part as a best guess for company if it's not "LinkedIn" etc.
                        const candidate = parts[1].trim()
                        const ignored = ["LinkedIn", "Indeed", "Naukri", "Job", "Work"]
                        if (!ignored.some(i => candidate.includes(i))) {
                            jobData.company = candidate
                            log(`Found company from doc.title split by '${s}'`)
                        }
                    }

                    log(`Found title from doc.title split by '${s}'`)
                    break
                }
            }

            if (!jobData.title) {
                jobData.title = docTitle
                log("Used full doc.title as fallback")
            }
        }
    }

    return jobData
}
