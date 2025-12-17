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
        email: "",
        phone: "",
        linkedin: "",
        skills: "",
        experience: "",
        location: "",
        job_type: "any",
        notice_period: ""
    })
    const [loading, setLoading] = useState(false)
    const [matchResult, setMatchResult] = useState<{ score: number, reasoning: string } | null>(null)
    const [toast, setToast] = useState<{ msg: string, type: 'error' | 'success' | 'info' } | null>(null)
    const [genStatus, setGenStatus] = useState("")

    // Debug State
    const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
    const [scanStatus, setScanStatus] = useState("Initializing...")
    const [isAuth, setIsAuth] = useState(false)

    // Auth & Storage Listener
    useEffect(() => {
        const checkAuth = () => {
            chrome.storage.local.get(["authState"], (res) => {
                setIsAuth(res.authState === "AUTHENTICATED")
            })
        }
        checkAuth()

        const listener = (changes: any, area: string) => {
            if (area === "local" && changes.authState) {
                checkAuth()
            }
        }
        chrome.storage.onChanged.addListener(listener)
        return () => chrome.storage.onChanged.removeListener(listener)
    }, [])

    // Sync local state with storage when modal opens
    useEffect(() => {
        if (isOpen) {
            chrome.storage.local.get("userProfile", (res) => {
                if (res.userProfile) {
                    const p = res.userProfile
                    setUserData({
                        full_name: p.full_name || "",
                        email: p.contact_details?.email || "",
                        phone: p.contact_details?.phone || "",
                        linkedin: p.contact_details?.linkedin || "",
                        skills: Array.isArray(p.skills) ? p.skills.join(", ") : (p.skills || ""),
                        experience: p.experience || "",
                        location: p.preferences?.location || "",
                        job_type: p.preferences?.job_type || "any",
                        notice_period: p.preferences?.notice_period || ""
                    })
                }
            })
        }
    }, [isOpen])

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

    const handleLogin = async () => {
        try {
            const res = await chrome.runtime.sendMessage({ action: "LOGIN" });
            if (!res.success) {
                showToast("Login failed: " + res.error, "error");
            } else {
                // Auth state listener will handle the rest
                showToast("Logged in successfully!", "success");
            }
        } catch (e: any) {
            showToast("Login error: " + e.message, "error");
        }
    }

    const handleLogout = async () => {
        try {
            const res = await chrome.runtime.sendMessage({ action: "LOGOUT" });
            if (!res.success) {
                showToast("Logout failed: " + res.error, "error");
            } else {
                showToast("Logged out successfully.", "success");
                // Auth state listener will handle UI update
            }
        } catch (e: any) {
            showToast("Logout error: " + e.message, "error");
        }
    }

    const handleSaveProfile = async (newData: any) => {
        try {
            // Fetch current ID if needed (though likely we just overwrite based on logic)
            const stored = await chrome.storage.local.get("userProfile");
            const currentProfile = stored.userProfile || {};

            const finalData = {
                ...currentProfile,
                full_name: newData.full_name,
                experience: newData.experience,
                skills: typeof newData.skills === 'string'
                    ? newData.skills.split(",").map((s: string) => s.trim()).filter((s: string) => s)
                    : newData.skills,
                contact_details: {
                    email: newData.email,
                    phone: newData.phone,
                    linkedin: newData.linkedin
                },
                preferences: {
                    location: newData.location,
                    job_type: newData.job_type,
                    notice_period: newData.notice_period
                }
            };

            const res = await chrome.runtime.sendMessage({
                action: "SAVE_PROFILE",
                payload: {
                    uid: currentProfile.uid, // Ensure UID is present if it exists
                    data: finalData
                }
            });

            if (!res.success) throw new Error(res.error);

            showToast("Profile updated!", "success");
            // Local storage update is handled by background script logic usually, 
            // but we can also update local state if we want immediate reflection before storage event

        } catch (e: any) {
            showToast("Failed to save: " + e.message, "error");
            throw e; // Propagate to modal to stop loading state
        }
    }

    const handleGenerate = async () => {
        if (!isAuth) {
            setIsOpen(true); // Open modal to show login prompt
            return
        }
        if (!jobData) return

        if (!isContextValid()) {
            showToast("Extension context invalidated. Please refresh.", "error")
            return
        }

        setLoading(true)
        setGenStatus("Generating...")
        try {
            // Fetch latest user data from storage to ensure we have it
            const stored = await chrome.storage.local.get("userProfile")
            // Use stored profile if avail, else fallback to current local state
            // Normalize data because state is flat but storage is nested
            const p = stored.userProfile || {}

            // Construct data from either source, preferring storage (p) but falling back to state (userData)
            const email = p.contact_details?.email || userData.email
            const phone = p.contact_details?.phone || userData.phone
            const linkedin = p.contact_details?.linkedin || userData.linkedin
            const fullName = p.full_name || userData.full_name
            const experience = p.experience || userData.experience

            // Skills: storage is array, state is string
            const skills = p.skills || (userData.skills ? userData.skills.split(",").map((s: string) => s.trim()) : [])

            // Preferences
            const preferences = p.preferences || {
                location: userData.location,
                job_type: userData.job_type,
                notice_period: userData.notice_period
            }

            const contactString = [email, phone, linkedin].filter(Boolean).join(" | ");

            const payload = {
                user_data: {
                    full_name: fullName,
                    contact_info: contactString,
                    skills: skills,
                    experience: experience,
                    preferences: preferences
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
        if (!isAuth) {
            setIsOpen(true); // Open modal to show login prompt
            return
        }
        if (!jobData) return
        if (!isContextValid()) {
            showToast("Extension context invalidated. Please refresh.", "error")
            return
        }

        setLoading(true)
        setMatchResult(null)
        try {
            // Fetch latest user data from storage
            const stored = await chrome.storage.local.get("userProfile")
            const p = stored.userProfile || {}

            // Construct data from either source, preferring storage (p) but falling back to state (userData)
            const email = p.contact_details?.email || userData.email
            const phone = p.contact_details?.phone || userData.phone
            const linkedin = p.contact_details?.linkedin || userData.linkedin
            const fullName = p.full_name || userData.full_name
            const experience = p.experience || userData.experience

            // Skills: storage is array, state is string
            const skills = p.skills || (userData.skills ? userData.skills.split(",").map((s: string) => s.trim()) : [])

            const contactString = [email, phone, linkedin].filter(Boolean).join(" | ");

            const payload = {
                user_data: {
                    full_name: fullName,
                    contact_info: contactString,
                    skills: skills,
                    experience: experience
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
                isAuth={isAuth}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onSaveProfile={handleSaveProfile}
            />
        </div>
    )
}

export default ResumatorApp
