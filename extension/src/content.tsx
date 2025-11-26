// @ts-ignore
import cssText from "data-text:./style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import { scrapePage } from "./scraper"

export const config: PlasmoCSConfig = {
    matches: ["https://www.linkedin.com/*", "https://in.indeed.com/*", "https://www.indeed.com/*", "https://www.naukri.com/*"]
}

export const getStyle = () => {
    const style = document.createElement("style")
    style.textContent = cssText
    return style
}

// Inline Button Component
const InlineButton = ({ onClick }: { onClick: () => void }) => (
    <button
        onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onClick()
        }}
        className="resumator-inline-btn"
        style={{
            zIndex: 9999,
            display: 'inline-flex',
            alignItems: 'center',
            height: 'fit-content',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', // Indigo to Blue gradient
            color: 'white',
            fontWeight: 'bold',
            borderRadius: '24px', // More rounded for modern look
            padding: '8px 20px',
            marginLeft: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)', // Subtle border
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.2)', // Depth + Gloss
            fontSize: '14px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            transition: 'all 0.2s ease',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }}
        onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.filter = 'brightness(110%)'
        }}
        onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            e.currentTarget.style.filter = 'brightness(100%)'
        }}
    >
        <span style={{ marginRight: '8px', fontSize: '18px', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}>✨</span>
        <span>Generate Resume</span>
    </button>
)

const ResumeOverlay = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [jobData, setJobData] = useState<any>(null)
    const [userData, setUserData] = useState({
        full_name: "",
        contact_info: "",
        skills: "",
        experience: ""
    })
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState("")

    const handleGenerate = async () => {
        if (!jobData) return
        setLoading(true)
        setStatus("Generating...")
        try {
            const payload = {
                user_data: {
                    ...userData,
                    skills: userData.skills.split(",").map((s: string) => s.trim())
                },
                job_description: jobData.description
            }

            const res = await fetch("http://localhost:8000/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error("Backend error")

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `Resume_${jobData.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)

            setStatus("Done! PDF Downloaded.")
        } catch (e: any) {
            setStatus("Error: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    // Injection Logic
    useEffect(() => {
        const checkJob = () => {
            const data = scrapePage()
            if (data.title) {
                setJobData(data)
            }
        }

        const injectInlineButton = () => {
            if (document.getElementById("resumator-inline-container")) return

            console.log("Resumator: Starting injection check...")

            // LinkedIn & Indeed & Naukri Apply Button Selectors
            const selectors = [
                // LinkedIn
                ".jobs-apply-button--top-card",
                ".jobs-s-apply",
                ".job-details-jobs-unified-top-card__container--two-pane .jobs-apply-button--top-card",

                // Indeed - Specific & Robust
                "[id^='indeedApplyButton']",
                "#jobsearch-ViewJobButtons-container",
                ".jobsearch-JobInfoHeader-actions",
                "button[aria-label*='Apply']",
                "button[contenthtml*='Apply']", // Found in user snippet
                ".jobsearch-IndeedApplyButton-newDesign",
                "#viewJobButtonLinkContainer",

                // Naukri
                ".apply-button",
                "#apply-button",
                ".styles_apply-button__w_88X"
            ]

            let targetBtn: HTMLElement | null = null

            // 1. Try Specific Selectors
            for (const sel of selectors) {
                const el = document.querySelector(sel) as HTMLElement
                if (el) {
                    // For container-like selectors on Indeed, we might want to append to them or find the button inside
                    if (sel.includes("container") || sel.includes("actions")) {
                        targetBtn = el
                    } else {
                        targetBtn = el
                    }
                    break
                }
            }

            // 2. Aggressive Text Search (Fallback for all platforms)
            if (!targetBtn) {
                const buttons = Array.from(document.querySelectorAll('button, a'))
                for (const btn of buttons) {
                    const text = btn.textContent?.toLowerCase() || ""
                    const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || ""
                    const contentHtml = btn.getAttribute('contenthtml')?.toLowerCase() || ""

                    // Check for "Apply" keywords
                    const isApplyBtn = (text.includes('apply') || text.includes('easy apply') || text.includes('login to apply') ||
                        ariaLabel.includes('apply') || contentHtml.includes('apply'))

                    if (isApplyBtn &&
                        btn.getBoundingClientRect().width > 50 &&
                        btn.getBoundingClientRect().height > 20) {
                        targetBtn = btn as HTMLElement
                        break
                    }
                }
            }

            if (targetBtn) {
                console.log("Resumator: Found target button/container:", targetBtn)
                const container = document.createElement("div")
                container.id = "resumator-inline-container"
                container.style.display = "inline-block"
                container.style.marginLeft = "8px"
                container.style.verticalAlign = "middle"
                container.style.position = "relative"
                container.style.zIndex = "2147483647"

                // Insert logic:
                if (targetBtn.classList.contains("jobsearch-JobInfoHeader-actions") ||
                    targetBtn.id === "jobsearch-ViewJobButtons-container") {
                    console.log("Resumator: Appending to container")
                    targetBtn.appendChild(container)
                } else {
                    console.log("Resumator: Inserting after element")
                    targetBtn.parentNode?.insertBefore(container, targetBtn.nextSibling)
                }

                const root = createRoot(container)
                root.render(<InlineButton onClick={() => setIsOpen(true)} />)
            } else {
                console.log("Resumator: No target button found via any selector.")
            }
        }

        checkJob()
        injectInlineButton()

        const observer = new MutationObserver(() => {
            checkJob()
            injectInlineButton()
        })
        observer.observe(document.body, { childList: true, subtree: true })

        return () => observer.disconnect()
    }, [])

    if (!jobData) return null

    return (
        <div className="fixed bottom-5 right-5 z-50 font-sans">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105"
                >
                    <span className="text-xl">📄</span>
                    <span className="font-bold">Generate Resume</span>
                </button>
            ) : (
                <div className="bg-white rounded-xl shadow-2xl w-[350px] overflow-hidden border border-gray-200 flex flex-col max-h-[600px]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex justify-between items-center">
                        <h2 className="font-bold">Resumator AI</h2>
                        <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">✕</button>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto flex-1 space-y-4">
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                            <p className="text-xs font-bold text-green-800 uppercase">Detected Job</p>
                            <p className="font-bold text-gray-800 text-sm">{jobData.title}</p>
                            <p className="text-xs text-gray-600">{jobData.company}</p>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-400 uppercase">Your Details</p>
                            <input
                                className="w-full p-2 border rounded text-sm"
                                placeholder="Full Name"
                                value={userData.full_name}
                                onChange={e => setUserData({ ...userData, full_name: e.target.value })}
                            />
                            <textarea
                                className="w-full p-2 border rounded text-sm"
                                rows={3}
                                placeholder="Skills..."
                                value={userData.skills}
                                onChange={e => setUserData({ ...userData, skills: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-gray-50 border-t space-y-3">
                        {/* Match Score Section */}
                        <div className="flex gap-2">
                            <button
                                onClick={async () => {
                                    if (!jobData) return
                                    setLoading(true)
                                    setStatus("Calculating Match...")
                                    try {
                                        const payload = {
                                            user_data: {
                                                ...userData,
                                                skills: userData.skills.split(",").map((s: string) => s.trim())
                                            },
                                            job_description: jobData.description
                                        }

                                        const res = await fetch("http://localhost:8000/api/match", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify(payload)
                                        })

                                        if (!res.ok) throw new Error("Backend error")
                                        const data = await res.json()

                                        // Show result (you might want a better UI for this)
                                        alert(`Match Score: ${data.score}%\nReasoning: ${data.reasoning}`)
                                        setStatus(`Match Score: ${data.score}%`)
                                    } catch (e: any) {
                                        setStatus("Error: " + e.message)
                                    } finally {
                                        setLoading(false)
                                    }
                                }}
                                disabled={loading}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-gray-400 text-sm"
                            >
                                Check Match
                            </button>

                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                            >
                                {loading ? "Working..." : "Generate PDF"}
                            </button>
                        </div>
                        {status && <p className="mt-2 text-center text-xs text-gray-600">{status}</p>}
                    </div>
                </div>
            )}
        </div>
    )
}

export default ResumeOverlay
