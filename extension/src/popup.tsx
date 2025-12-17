import { useState, useEffect } from "react"
import { scrapePage } from "./scraper"
import "./style.css"
import { auth } from "./firebase"
import { onAuthStateChanged, User } from "firebase/auth"
import { signInWithGoogle, getUserProfile, logout, type UserProfile } from "./services/authService"
import Onboarding from "./components/Onboarding"

type AuthState = "LOADING" | "UNAUTHENTICATED" | "ONBOARDING" | "AUTHENTICATED"

function IndexPopup() {
    // Auth State
    const [authState, setAuthState] = useState<AuthState>("LOADING")
    const [user, setUser] = useState<User | null>(null)
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null)

    // Main App State
    const [activeTab, setActiveTab] = useState<"auto" | "manual">("auto")
    const [jobData, setJobData] = useState<any>(null)
    const [manualJob, setManualJob] = useState({ title: "", description: "" })
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState("")
    const [showDebug, setShowDebug] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser)
            if (currentUser) {
                // Check if profile exists
                try {
                    const profile = await getUserProfile(currentUser.uid)
                    if (profile) {
                        setUserProfile(profile)
                        setAuthState("AUTHENTICATED")
                    } else {
                        setAuthState("ONBOARDING")
                    }
                } catch (e) {
                    console.error("Profile check failed", e)
                    // Fallback or retry? valid user but DB error.
                    setAuthState("ONBOARDING") // Assume no profile if error or treat as new
                }
            } else {
                setAuthState("UNAUTHENTICATED")
            }
        })
        return () => unsubscribe()
    }, [])

    useEffect(() => {
        if (authState !== "AUTHENTICATED") return

        // Active Scraping Logic (Only run when authenticated)
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const currentTab = tabs[0]
            if (currentTab?.id && currentTab.url) {
                const url = currentTab.url
                const linkedinJobRegex = /linkedin\.com\/.*(?:jobs\/view\/|[?&]currentJobId=)/
                const indeedJobRegex = /indeed\.com\/.*(?:viewjob|jobs|cmp\/.*\/jobs|[?&]vjk=)/
                const isSupported = linkedinJobRegex.test(url) || indeedJobRegex.test(url)

                if (!isSupported) {
                    // console.log("Not a target job page")
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
    }, [authState])

    const handleGenerate = async () => {
        if (!userProfile) return
        setLoading(true)
        setStatus("Generating resume...")

        try {
            const finalJobDesc = activeTab === "auto" ? jobData?.description : manualJob.description
            const finalJobTitle = activeTab === "auto" ? jobData?.title : manualJob.title

            if (!finalJobDesc) throw new Error("Job Description is missing!")

            // Backward compatibility: Concatenate contact details for backend
            const contactString = [
                userProfile.contact_details?.email,
                userProfile.contact_details?.phone,
                userProfile.contact_details?.linkedin
            ].filter(Boolean).join(" | ");

            const payload = {
                user_data: {
                    full_name: userProfile.full_name,
                    contact_info: contactString,
                    skills: userProfile.skills, // Already array
                    experience: userProfile.experience,
                    preferences: userProfile.preferences
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

    const handleLogin = async () => {
        try {
            await signInWithGoogle()
            // State update handled by onAuthStateChanged
        } catch (e: any) {
            setStatus("Login Failed: " + e.message)
        }
    }

    const handleOnboardingComplete = (profile: UserProfile) => {
        setUserProfile(profile)
        setAuthState("AUTHENTICATED")
    }

    // --- RENDER ---

    if (authState === "LOADING") {
        return (
            <div className="w-[400px] bg-slate-50 min-h-[550px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (authState === "UNAUTHENTICATED") {
        return (
            <div className="w-[400px] bg-slate-50 min-h-[550px] flex flex-col items-center justify-center p-8">
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold text-blue-700 mb-2">Resumator</h1>
                    <p className="text-gray-500">AI-Powered Resume Generator</p>
                </div>
                <button
                    onClick={handleLogin}
                    className="flex items-center gap-3 bg-white border border-gray-300 px-6 py-3 rounded-lg shadow-sm hover:bg-gray-50 transition w-full justify-center font-medium text-gray-700"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                    Sign in with Google
                </button>
                {status && <p className="mt-4 text-xs text-red-500 text-center">{status}</p>}
            </div>
        )
    }

    if (authState === "ONBOARDING" && user) {
        return (
            <div className="w-[400px] bg-slate-50 min-h-[550px] flex flex-col">
                <Onboarding user={user} onComplete={handleOnboardingComplete} />
            </div>
        )
    }

    // AUTHENTICATED STATE (Main App)
    return (
        <div className="w-[400px] bg-slate-50 min-h-[550px] font-sans text-slate-800 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white shadow-md shrink-0 flex justify-between items-center">
                <h1 className="text-xl font-bold tracking-tight">Resumator AI</h1>
                <div className="flex gap-2">
                    <button onClick={() => setShowDebug(!showDebug)} className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition">
                        {showDebug ? "Hide Debug" : "Debug"}
                    </button>
                    <button onClick={logout} className="text-xs bg-red-500/80 px-2 py-1 rounded hover:bg-red-500 transition">
                        Logout
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
                                <p className="font-semibold">Ag No Job Detected</p>
                                <p className="mt-1">We couldn't read the job details automatically.</p>
                                <button onClick={() => setActiveTab("manual")} className="mt-2 text-blue-600 underline font-semibold">
                                    Switch to Manual Mode
                                </button>
                            </div>
                        )}
                        {showDebug && (
                            <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-auto max-h-32">
                                <p className="font-bold border-b border-gray-700 mb-1">Debug Logs:</p>
                                {jobData?.debug_info?.map((log: string, i: number) => (
                                    <div key={i}>{log}</div>
                                )) || "No logs"}
                                <div className="mt-2 border-t border-gray-700 pt-1">
                                    <pre>{JSON.stringify({ title: jobData?.title, company: jobData?.company, desc_len: jobData?.description?.length }, null, 2)}</pre>
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

                {/* User Details Form (READ ONLY / EDIT LINK) */}
                <div className="space-y-3 pt-2 border-t text-sm text-gray-600">
                    <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-gray-400 uppercase">Your Profile</p>
                        <button className="text-blue-600 text-xs hover:underline" onClick={() => setAuthState("ONBOARDING")}>Edit Profile</button>
                    </div>
                    <div className="bg-white p-3 rounded border space-y-2">
                        <p><strong>Name:</strong> {userProfile?.full_name}</p>
                        <p><strong>Email:</strong> {userProfile?.contact_details?.email}</p>
                        <p><strong>Exp:</strong> {userProfile?.experience.substring(0, 50)}...</p>
                    </div>
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
