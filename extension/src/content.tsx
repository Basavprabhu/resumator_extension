// @ts-ignore
import cssText from "data-text:./style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect, useState, useRef } from "react"
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

// --- Debug Helper ---
const DEBUG = false // Toggle this to false when done

type DebugLog = { ts: string, msg: string }

// --- Components ---

const DebugOverlay = ({ logs, jobData, status }: { logs: DebugLog[], jobData: any, status: string }) => {
    if (!DEBUG) return null
    return (
        <div style={{
            position: 'fixed',
            bottom: '10px',
            left: '10px',
            zIndex: 999999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            color: '#0f0',
            fontFamily: 'monospace',
            fontSize: '11px',
            padding: '10px',
            borderRadius: '8px',
            maxWidth: '300px',
            maxHeight: '400px',
            overflowY: 'auto',
            pointerEvents: 'none', // Click through
            border: '1px solid #0f0'
        }}>
            <h3 style={{ margin: '0 0 5px 0', borderBottom: '1px solid #555' }}>Resumator Debugger</h3>
            <div style={{ marginBottom: '5px' }}>
                <strong>Status:</strong> {status}<br />
                <strong>Platform:</strong> {jobData?.platform || 'Unknown'}<br />
                <strong>Title:</strong> {jobData?.title || 'None'}<br />
                <strong>Desc Len:</strong> {jobData?.description?.length || 0} chars
            </div>
            <div style={{ borderTop: '1px dashed #555', paddingTop: '5px' }}>
                {logs.slice(-10).map((l, i) => (
                    <div key={i}>[{l.ts}] {l.msg}</div>
                ))}
            </div>
        </div>
    )
}

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
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            color: 'white',
            fontWeight: 'bold',
            borderRadius: '24px',
            padding: '8px 20px',
            marginLeft: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            fontSize: '14px',
            fontFamily: 'sans-serif',
            transition: 'all 0.2s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
        <span style={{ marginRight: '8px', fontSize: '18px' }}>✨</span>
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
    const [genStatus, setGenStatus] = useState("")

    // Debug State
    const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
    const [scanStatus, setScanStatus] = useState("Initializing...")

    const addLog = (msg: string) => {
        console.log(`[Resumator] ${msg}`)
        const ts = new Date().toLocaleTimeString().split(' ')[0]
        setDebugLogs(prev => [...prev, { ts, msg }])
    }

    const handleGenerate = async () => {
        if (!jobData) return
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

            setGenStatus("Done! PDF Downloaded.")
        } catch (e: any) {
            setGenStatus("Error: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    // Injection & Scraping Logic
    useEffect(() => {
        let mounted = true
        addLog("Mounting Content Script...")

        const scanner = () => {
            if (!mounted) return

            // 1. Scrape Job Data
            try {
                const data = scrapePage()
                if (data.title) {
                    setJobData(data)
                    data.debug_info?.forEach(d => addLog(`[Scraper] ${d}`))
                } else {
                    addLog("Scraper: No Title Found yet")
                }
            } catch (e: any) {
                addLog(`Scraper Error: ${e.message}`)
            }

            // 2. Inject Button
            if (document.getElementById("resumator-inline-container")) return

            setScanStatus("Scanning for Apply Button...")

            // Naukri specific
            const naukriSelectors = [
                "#reg-apply-button",
                "#login-apply-button",
                ".apply-button",
                "#apply-button",
                ".styles_apply-button__w_88X",
                ".styles_reg-apply-button__lUN1u"
            ]

            const generalSelectors = [
                ".jobs-apply-button--top-card", // LinkedIn
                ".jobs-s-apply",
                "[id^='indeedApplyButton']",
                "#jobsearch-ViewJobButtons-container"
            ]

            const allSelectors = [...naukriSelectors, ...generalSelectors]

            let targetBtn: HTMLElement | null = null

            // Try Selectors
            for (const sel of allSelectors) {
                const el = document.querySelector(sel) as HTMLElement
                if (el) {
                    targetBtn = el
                    addLog(`Found button via selector: ${sel}`)
                    break
                }
            }

            // Try Text Fallback
            if (!targetBtn) {
                const buttons = Array.from(document.querySelectorAll('button, a'))
                addLog(`Checking ${buttons.length} buttons/links...`)

                for (const btn of buttons) {
                    const safeText = (btn.innerText || btn.textContent || "").toLowerCase()
                    const ariaLabel = (btn.getAttribute('aria-label') || "").toLowerCase()

                    const isApply = safeText.includes('apply') || ariaLabel.includes('apply') || safeText.includes('easy apply')
                    const isNotLogin = !safeText.includes('login') || safeText.includes('login to apply')

                    // Relaxed size check
                    const rect = btn.getBoundingClientRect()
                    const isVisible = rect.width > 20 && rect.height > 10

                    if (isApply && isNotLogin && isVisible) {
                        targetBtn = btn as HTMLElement
                        addLog(`Found text match: "${safeText.slice(0, 20)}..." (${Math.round(rect.width)}x${Math.round(rect.height)})`)
                        break
                    }
                }
            }

            if (targetBtn) {
                try {
                    const container = document.createElement("div")
                    container.id = "resumator-inline-container"
                    container.style.cssText = "display:inline-block; margin-left:8px; vertical-align:middle; position:relative; z-index:2147483647;"

                    // Safer insertion
                    if (targetBtn.parentNode) {
                        targetBtn.parentNode.insertBefore(container, targetBtn.nextSibling)
                        const root = createRoot(container)
                        root.render(<InlineButton onClick={() => setIsOpen(true)} />)
                        addLog("Button Injected Successfully!")
                        setScanStatus("Injected")
                    } else {
                        addLog("Error: Target button has no parent?")
                    }
                } catch (e: any) {
                    addLog(`Injection Error: ${e.message}`)
                }
            } else {
                setScanStatus("Retrying... Button not found")
            }
        }

        scanner()
        const interval = setInterval(scanner, 2000) // Re-scan every 2s

        return () => {
            mounted = false
            clearInterval(interval)
        }
    }, [])

    return (
        <div className="resumator-root">
            <DebugOverlay logs={debugLogs} jobData={jobData} status={scanStatus} />

            {/* Main Floating Button (Still kept as backup) */}
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
                                <p className="font-bold text-gray-800 text-sm">{jobData?.title || "Detecting..."}</p>
                                <p className="text-xs text-gray-600">{jobData?.company || ""}</p>
                            </div>

                            <div className="space-y-2">
                                <p className="text-xs font-bold text-gray-400 uppercase">Your Details</p>
                                <input className="w-full p-2 border rounded text-sm" placeholder="Full Name" value={userData.full_name} onChange={e => setUserData({ ...userData, full_name: e.target.value })} />
                                <textarea className="w-full p-2 border rounded text-sm" rows={3} placeholder="Skills..." value={userData.skills} onChange={e => setUserData({ ...userData, skills: e.target.value })} />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t space-y-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        if (!jobData) return
                                        setLoading(true)
                                        setGenStatus("Calculating Match...")
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
                                            setGenStatus(`Match Score: ${data.score}%`)
                                        } catch (e: any) {
                                            setGenStatus("Error: " + e.message)
                                        } finally {
                                            setLoading(false)
                                        }
                                    }}
                                    disabled={loading}
                                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 disabled:bg-gray-400 text-sm"
                                >
                                    Check Match
                                </button>
                                <button onClick={handleGenerate} disabled={loading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold text-sm">
                                    {loading ? "Working..." : "Generate PDF"}
                                </button>
                            </div>
                            {genStatus && <p className="mt-2 text-center text-xs text-gray-600">{genStatus}</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default ResumeOverlay
