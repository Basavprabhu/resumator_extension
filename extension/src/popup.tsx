import { useState, useEffect } from "react"
import { scrapePage } from "./scraper"
import "./style.css"

function IndexPopup() {
    const [activeTab, setActiveTab] = useState<"auto" | "manual">("auto")
    const [jobData, setJobData] = useState<any>(null)
    const [userData, setUserData] = useState({
        full_name: "",
        contact_info: "",
        skills: "",
        experience: ""
    })
    const [manualJob, setManualJob] = useState({ title: "", description: "" })
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState("")
    const [showDebug, setShowDebug] = useState(false)

    useEffect(() => {
        // Load User Data
        chrome.storage.local.get("userData", (res) => {
            if (res.userData) setUserData(res.userData)
        })

        // Active Scraping with Smart Regex
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const currentTab = tabs[0]
            if (currentTab?.id && currentTab.url) {
                const url = currentTab.url

                // Smart Regex Patterns
                // LinkedIn: Matches /jobs/view/ OR any URL with currentJobId parameter
                const linkedinJobRegex = /linkedin\.com\/.*(?:jobs\/view\/|[?&]currentJobId=)/
                // Indeed: Matches /viewjob, /jobs, OR any URL with vjk parameter
                const indeedJobRegex = /indeed\.com\/.*(?:viewjob|jobs|cmp\/.*\/jobs|[?&]vjk=)/

                const isSupported = linkedinJobRegex.test(url) || indeedJobRegex.test(url)

                if (!isSupported) {
                    console.log("Not a target job page, skipping scrape.")
                    setStatus("Not a recognized job page. Switched to Manual Mode.")
                    setActiveTab("manual")
                    return
                }

                try {
                    const results = await chrome.scripting.executeScript({
                        target: { tabId: currentTab.id },
                        func: scrapePage
                    })

                    if (results && results[0]?.result) {
                        const data = results[0].result
                        setJobData(data)
                        if (!data.title) setActiveTab("manual")
                    }
                } catch (e) {
                    console.error("Injection failed", e)
                    setActiveTab("manual")
                }
            }
        })
    }, [])

    const handleGenerate = async () => {
        setLoading(true)
        setStatus("Generating resume...")
        chrome.storage.local.set({ userData })

        try {
            const finalJobDesc = activeTab === "auto" ? jobData?.description : manualJob.description
            const finalJobTitle = activeTab === "auto" ? jobData?.title : manualJob.title

            if (!finalJobDesc) throw new Error("Job Description is missing!")

            const payload = {
                user_data: {
                    ...userData,
                    skills: userData.skills.split(",").map(s => s.trim())
                },
                job_description: finalJobDesc
            }

            const res = await fetch("http://localhost:8000/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })

            if (!res.ok) throw new Error("Backend error. Is it running?")

            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `Resume_${finalJobTitle || "Generated"}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)

            setStatus("Success! Resume downloaded.")
        } catch (e: any) {
            setStatus("Error: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-[400px] bg-slate-50 min-h-[550px] font-sans text-slate-800 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white shadow-md shrink-0">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold tracking-tight">Resumator AI</h1>
                    <button onClick={() => setShowDebug(!showDebug)} className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition">
                        {showDebug ? "Hide Debug" : "Debug"}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b bg-white">
                <button
                    onClick={() => setActiveTab("auto")}
                    className={`flex-1 py-3 text-sm font-semibold ${activeTab === "auto" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
                >
                    Auto-Detect
                </button>
                <button
                    onClick={() => setActiveTab("manual")}
                    className={`flex-1 py-3 text-sm font-semibold ${activeTab === "manual" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
                >
                    Manual Input
                </button>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                {/* Auto Mode UI */}
                {activeTab === "auto" && (
                    <>
                        {jobData?.title ? (
                            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
                                <h3 className="font-bold text-gray-800">{jobData.title}</h3>
                                <p className="text-sm text-gray-600">{jobData.company}</p>
                                <div className="mt-2 flex gap-2">
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Detected</span>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full capitalize">{jobData.platform}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm">
                                <p className="font-semibold">⚠️ No Job Detected</p>
                                <p className="mt-1">We couldn't read the job details automatically.</p>
                                <button onClick={() => setActiveTab("manual")} className="mt-2 text-blue-600 underline font-semibold">
                                    Switch to Manual Mode
                                </button>
                            </div>
                        )}
                        {showDebug && (
                            <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-auto max-h-32">
                                <p className="font-bold border-b border-gray-700 mb-1">Debug Logs:</p>
                                {jobData.debug_info?.map((log: string, i: number) => (
                                    <div key={i}>{log}</div>
                                )) || "No logs"}
                                <div className="mt-2 border-t border-gray-700 pt-1">
                                    <pre>{JSON.stringify({ title: jobData.title, company: jobData.company, desc_len: jobData.description?.length }, null, 2)}</pre>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Manual Mode UI */}
                {activeTab === "manual" && (
                    <div className="space-y-3 bg-white p-3 rounded shadow-sm">
                        <input
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Job Title (e.g. Senior React Dev)"
                            value={manualJob.title}
                            onChange={e => setManualJob({ ...manualJob, title: e.target.value })}
                        />
                        <textarea
                            className="w-full p-2 border rounded text-sm"
                            rows={4}
                            placeholder="Paste Job Description here..."
                            value={manualJob.description}
                            onChange={e => setManualJob({ ...manualJob, description: e.target.value })}
                        />
                    </div>
                )}

                {/* User Details Form */}
                <div className="space-y-3 pt-2 border-t">
                    <p className="text-xs font-bold text-gray-400 uppercase">Your Profile</p>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Full Name"
                            value={userData.full_name}
                            onChange={e => setUserData({ ...userData, full_name: e.target.value })}
                        />
                        <input
                            className="w-full p-2 border rounded text-sm"
                            placeholder="Contact Info"
                            value={userData.contact_info}
                            onChange={e => setUserData({ ...userData, contact_info: e.target.value })}
                        />
                    </div>
                    <textarea
                        className="w-full p-2 border rounded text-sm"
                        rows={2}
                        placeholder="Skills (React, Python...)"
                        value={userData.skills}
                        onChange={e => setUserData({ ...userData, skills: e.target.value })}
                    />
                    <textarea
                        className="w-full p-2 border rounded text-sm"
                        rows={3}
                        placeholder="Experience Summary..."
                        value={userData.experience}
                        onChange={e => setUserData({ ...userData, experience: e.target.value })}
                    />
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 bg-gray-50 border-t shrink-0">
                <button
                    onClick={handleGenerate}
                    disabled={loading || (activeTab === "auto" && !jobData?.title) || (activeTab === "manual" && !manualJob.description)}
                    className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
                        }`}
                >
                    {loading ? "Generating..." : "Generate Resume"}
                </button>
                {status && <p className="mt-2 text-center text-xs text-gray-600">{status}</p>}
            </div>
        </div>
    )
}

export default IndexPopup
