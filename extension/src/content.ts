import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
    matches: ["https://www.linkedin.com/*", "https://www.indeed.com/*"],
    all_frames: true
}

// Helper to log debug messages
const debugLog = (msg: string, data?: any) => {
    console.log(`[Resumator Debug]: ${msg}`, data || "")
}

const scrapeJobDetails = () => {
    const url = window.location.href
    debugLog("Scraping URL:", url)

    let jobData = {
        title: "",
        company: "",
        description: "",
        url: url,
        platform: "unknown"
    }

    try {
        if (url.includes("linkedin.com")) {
            jobData.platform = "linkedin"
            // Strategy 1: Detailed View
            const titleEl = document.querySelector(".job-details-jobs-unified-top-card__job-title") ||
                document.querySelector("h1.t-24") ||
                document.querySelector(".jobs-unified-top-card__job-title")

            const companyEl = document.querySelector(".job-details-jobs-unified-top-card__company-name") ||
                document.querySelector(".jobs-unified-top-card__company-name")

            const descEl = document.querySelector(".jobs-description__content") ||
                document.querySelector("#job-details") ||
                document.querySelector(".jobs-box__html-content")

            jobData.title = titleEl?.textContent?.trim() || ""
            jobData.company = companyEl?.textContent?.trim() || ""
            jobData.description = descEl?.textContent?.trim() || ""
        }
        else if (url.includes("indeed.com")) {
            jobData.platform = "indeed"
            const titleEl = document.querySelector(".jobsearch-JobInfoHeader-title") || document.querySelector("h1")
            const companyEl = document.querySelector("[data-company-name='true']") || document.querySelector(".jobsearch-CompanyInfoContainer")
            const descEl = document.querySelector("#jobDescriptionText")

            jobData.title = titleEl?.textContent?.trim() || ""
            jobData.company = companyEl?.textContent?.trim() || ""
            jobData.description = descEl?.textContent?.trim() || ""
        }
    } catch (e) {
        debugLog("Error during scraping:", e)
    }

    debugLog("Scraped Data:", jobData)
    return jobData
}

// Listen for messages from Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_JOB_DETAILS") {
        const data = scrapeJobDetails()
        sendResponse(data)
    }
    return true // Keep channel open
})

debugLog("Content script loaded and ready")
