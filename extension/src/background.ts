import { scrapePage } from "./scraper"

// Listen for tab updates to update the badge
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        checkUrlAndSetBadge(tabId, tab.url)
    }
})

// Also check when switching tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId)
        if (tab.url) {
            checkUrlAndSetBadge(activeInfo.tabId, tab.url)
        }
    } catch (e) {
        // Tab might be closed or inaccessible
        console.debug("Error checking tab:", e)
    }
})

function checkUrlAndSetBadge(tabId: number, url: string) {
    // Smart Regex Patterns (Same as popup)
    const linkedinJobRegex = /linkedin\.com\/.*(?:jobs\/view\/|[?&]currentJobId=)/
    const indeedJobRegex = /indeed\.com\/.*(?:viewjob|jobs|cmp\/.*\/jobs|[?&]vjk=)/

    const isSupported = linkedinJobRegex.test(url) || indeedJobRegex.test(url)

    if (isSupported) {
        chrome.action.setBadgeText({ text: "JOB", tabId })
        chrome.action.setBadgeBackgroundColor({ color: "#22c55e", tabId }) // Green
    } else {
        chrome.action.setBadgeText({ text: "", tabId })
    }
}

// Proxy API Requests to avoid CSP issues
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GENERATE_RESUME") {
        fetch("http://localhost:8000/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request.payload)
        })
            .then(async (res) => {
                if (!res.ok) throw new Error("Backend error: " + res.statusText)
                const blob = await res.blob()
                // We can't send blob directly, so we send it as base64 or data url
                const reader = new FileReader()
                reader.readAsDataURL(blob)
                reader.onloadend = () => {
                    sendResponse({ success: true, dataUrl: reader.result, filename: request.filename })
                }
            })
            .catch((err) => {
                sendResponse({ success: false, error: err.message })
            })
        return true // Keep channel open
    }

    if (request.action === "MATCH_SCORE") {
        fetch("http://localhost:8000/api/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request.payload)
        })
            .then(async (res) => {
                if (!res.ok) throw new Error("Backend error: " + res.statusText)
                const data = await res.json()
                sendResponse({ success: true, data })
            })
            .catch((err) => {
                sendResponse({ success: false, error: err.message })
            })
        return true // Keep channel open
    }
})
