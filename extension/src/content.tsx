// @ts-ignore
import cssText from "data-text:./style.css"
import type { PlasmoCSConfig } from "plasmo"
import React, { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { scrapePage } from "./scraper"
import Toast from "./components/ui/Toast"
import DebugOverlay, { type DebugLog } from "./components/DebugOverlay"
import InlineMatchButton from "./components/InlineMatchButton"
import FloatingGenerateButton from "./components/FloatingGenerateButton"
import ResumeModal from "./components/ResumeModal"

export const config: PlasmoCSConfig = {
    matches: ["https://www.linkedin.com/*", "https://in.indeed.com/*", "https://www.indeed.com/*", "https://www.naukri.com/*"]
}

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText
    return style
}

// --- Global Error Suppression ---
if (typeof window !== "undefined") {
    window.addEventListener("error", (event) => {
        if (event.message?.includes("Extension context invalidated")) {
            event.preventDefault()
            event.stopImmediatePropagation()
            return true
        }
    }, true)
}

const ResumatorApp = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [jobData, setJobData] = useState<any>(null)
    const [userData, setUserData] = useState({
        full_name: "",
        contact_info: "",
        skills: "",
        experience: ""
    })
    const [loading, setLoading] = useState(false)
    const [matchResult, setMatchResult] = useState<{ score: number, reasoning: string } | null>(null)
    const [toast, setToast] = useState<{ msg: string, type: 'error' | 'success' | 'info' } | null>(null)
    const [genStatus, setGenStatus] = useState("")

    // Debug State
    const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
    const [scanStatus, setScanStatus] = useState("Initializing...")

    const addLog = (msg: string) => {
        console.log(`[Resumator] ${msg}`)
        const ts = new Date().toLocaleTimeString().split(' ')[0]
        setDebugLogs(prev => [...prev, { ts, msg }])
    }

    const showToast = (msg: string, type: 'error' | 'success' | 'info' = 'info') => {
        setToast({ msg, type })
    }

    const isContextValid = () => {
        try {
            return !!chrome.runtime?.id
        } catch (e) {
            return false
        }
    }

    // --- Actions ---

    const handleGenerate = async () => {
        if (!jobData) return

        if (!isContextValid()) {
            showToast("Extension context invalidated. Please refresh.", "error")
            return
        }

        setLoading(true)
        setGenStatus("Generating...")
        try {
            const payload = {
                user_data: {
                    ...userData,
                    skills: userData.skills.split(",").map((s: string) => s.trim())
                },
                job_description: jobData.description
            }

            const filename = `Resume_${jobData.title.replace(/[^a-z0-9]/gi, '_')}.pdf`

            const response = await chrome.runtime.sendMessage({
                action: "GENERATE_RESUME",
                payload,
                filename
            })

            if (!response.success) throw new Error(response.error || "Generation failed")

            // Download
            const link = document.createElement("a")
            link.href = response.dataUrl
            link.download = response.filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            showToast("Resume generated & downloaded!", "success")
            setGenStatus("Done! PDF Downloaded.")
        } catch (e: any) {
            if (e.message.includes("Extension context invalidated")) {
                showToast("Please refresh the page.", "error")
            } else {
                showToast(e.message, "error")
                setGenStatus("Error: " + e.message)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleMatchScore = async () => {
        if (!jobData) return
        if (!isContextValid()) {
            showToast("Extension context invalidated. Please refresh.", "error")
            return
        }

        setLoading(true)
        setMatchResult(null)
        try {
            const payload = {
                user_data: {
                    ...userData,
                    skills: userData.skills.split(",").map((s: string) => s.trim())
                },
                job_description: jobData.description
            }

            const response = await chrome.runtime.sendMessage({
                action: "MATCH_SCORE",
                payload
            })

            if (!response.success) throw new Error(response.error || "Matching failed")

            setMatchResult(response.data)
            showToast("Match analysis complete!", "success")
        } catch (e: any) {
            showToast(e.message, "error")
        } finally {
            setLoading(false)
        }
    }

    // --- Injection Logic ---
    useEffect(() => {
        let mounted = true
        addLog("Mounting Content Script with Unified Controller...")

        const scanAndInject = () => {
            if (!mounted) return

            if (!isContextValid()) {
                console.warn("[Resumator] Context invalidated. Cleaning up...")
                const existing = document.getElementById("resumator-inline-container")
                if (existing) existing.remove()
                mounted = false
                return
            }

            // 1. Scrape
            try {
                const data = scrapePage()
                if (data.title) {
                    setJobData((prev: any) => {
                        if (prev?.title !== data.title) return data
                        return prev
                    })
                    if (data.title !== jobData?.title) {
                        data.debug_info?.forEach(d => addLog(`[Scraper] ${d}`))
                    }
                }
            } catch (e) { }

            // 2. Inject Inline Match Button
            if (document.getElementById("resumator-inline-container")) return

            setScanStatus("Scanning for Apply Button...")

            // --- Strategy for Finding Apply Button (Reused logic) ---
            let searchRoot: HTMLElement | Document = document
            if (window.location.href.includes("linkedin.com")) {
                const detailContainers = [
                    ".jobs-search__job-details",
                    ".job-view-layout",
                    ".jobs-unified-top-card",
                    "main.scaffold-layout__main"
                ]

                let foundContainer = false
                for (const sel of detailContainers) {
                    const el = document.querySelector(sel) as HTMLElement
                    if (el && el.offsetHeight > 0) {
                        searchRoot = el
                        foundContainer = true
                        break
                    }
                }
            }

            const naukriSelectors = [
                "#reg-apply-button", "#login-apply-button", ".apply-button", "#apply-button",
                "button.apply-button", "a.apply-button", "[id*='apply-button']", "[class*='apply-button']",
                ".styles_apply-button__w_88X", ".styles_reg-apply-button__lUN1u"
            ]
            const generalSelectors = [
                ".jobs-apply-button--top-card", ".jobs-s-apply", "[id^='indeedApplyButton']", "#jobsearch-ViewJobButtons-container"
            ]
            const allSelectors = [...naukriSelectors, ...generalSelectors]
            let targetBtn: HTMLElement | null = null

            for (const sel of allSelectors) {
                const el = searchRoot.querySelector(sel) as HTMLElement
                if (el) {
                    targetBtn = el
                    break
                }
            }

            // Fallback heuristics
            if (!targetBtn && window.location.href.includes("linkedin.com")) {
                const insightSelectors = [
                    ".job-details-jobs-unified-top-card__job-insight",
                    ".jobs-unified-top-card__job-insight",
                    ".job-details-jobs-unified-top-card__job-insight-view-model-secondary",
                    ".job-details-jobs-unified-top-card__subtitle-secondary-grouping"
                ]
                for (const sel of insightSelectors) {
                    const elements = searchRoot.querySelectorAll(sel)
                    if (elements.length > 0) {
                        targetBtn = elements[elements.length - 1] as HTMLElement
                        break
                    }
                }
            }

            if (!targetBtn) {
                // Text Heuristic
                let buttonList: NodeListOf<Element> | HTMLElement[]
                if (searchRoot === document) {
                    buttonList = document.querySelectorAll('button, a, div[role="button"]')
                } else {
                    buttonList = (searchRoot as HTMLElement).querySelectorAll('button, a, div[role="button"]')
                }
                const buttons = Array.from(buttonList)
                for (const btn of buttons) {
                    const el = btn as HTMLElement
                    if (window.location.href.includes("linkedin.com") && (
                        el.closest('.jobs-search-results-list') || el.closest('.scaffold-layout__list')
                    )) continue

                    const safeText = (el.innerText || el.textContent || "").toLowerCase()
                    if ((safeText.includes('apply') || safeText.includes('easy apply')) && !safeText.includes('login')) {
                        const rect = el.getBoundingClientRect()
                        if (rect.width > 20 && rect.height > 10) {
                            targetBtn = el
                            break
                        }
                    }
                }
            }

            if (targetBtn) {
                try {
                    const container = document.createElement("div")
                    container.id = "resumator-inline-container"
                    container.style.cssText = "display:inline-block; vertical-align:middle; position:relative; z-index:999;"

                    if (targetBtn.parentNode) {
                        targetBtn.parentNode.insertBefore(container, targetBtn.nextSibling)
                        const root = createRoot(container)
                        const platform = window.location.hostname

                        // INJECT INLINE MATCH BUTTON
                        root.render(<InlineMatchButton onClick={() => {
                            setIsOpen(true)
                            // Ideally trigger match auto-check here or focus
                            handleMatchScore()
                        }} platform={platform} />)

                        addLog("Inline Match Button Injected")
                        setScanStatus("Injected")
                    }
                } catch (e) { }
            }
        }

        scanAndInject()

        let timeout: ReturnType<typeof setTimeout>
        const observer = new MutationObserver(() => {
            clearTimeout(timeout)
            timeout = setTimeout(() => {
                if (isContextValid()) scanAndInject()
            }, 500)
        })

        observer.observe(document.body, { childList: true, subtree: true })

        // URL Listener
        let lastUrl = window.location.href
        const urlObserver = setInterval(() => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href
                addLog("URL Changed")
                setJobData(null)
                document.getElementById("resumator-inline-container")?.remove()
                if (isContextValid()) scanAndInject()
            }
        }, 1000)

        return () => {
            mounted = false
            observer.disconnect()
            clearInterval(urlObserver)
            clearTimeout(timeout)
        }

    }, [])

    return (
        <div className="resumator-root">
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            <DebugOverlay logs={debugLogs} jobData={jobData} status={scanStatus} />

            {/* Always Visible Floating Action Button for Generation */}
            <FloatingGenerateButton
                visible={!isOpen}
                onClick={() => setIsOpen(true)}
            />

            {/* Main Modal */}
            <ResumeModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                jobData={jobData}
                userData={userData}
                setUserData={setUserData}
                loading={loading}
                matchResult={matchResult}
                onGenerate={handleGenerate}
                onCheckMatch={handleMatchScore}
                genStatus={genStatus}
            />
        </div>
    )
}

export default ResumatorApp
