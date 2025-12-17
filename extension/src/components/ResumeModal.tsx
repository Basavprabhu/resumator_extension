import React from "react"
import ErrorBoundary from "./ui/ErrorBoundary"

interface ResumeModalProps {
    isOpen: boolean
    onClose: () => void
    jobData: any
    userData: any
    setUserData: (data: any) => void
    loading: boolean
    matchResult: { score: number, reasoning: string } | null
    onGenerate: () => void
    onCheckMatch: () => void
    genStatus?: string
    isAuth: boolean
    onLogin: () => void
    onLogout: () => void
    onSaveProfile: (data: any) => Promise<void>
}

const ResumeModal = ({
    isOpen,
    onClose,
    jobData,
    userData,
    setUserData,
    loading,
    matchResult,
    onGenerate,
    onCheckMatch,
    genStatus,
    isAuth,
    onLogin,
    onLogout,
    onSaveProfile
}: ResumeModalProps) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [saveLoading, setSaveLoading] = React.useState(false);

    // Reset edit mode when modal opens/closes
    React.useEffect(() => {
        if (isOpen) setIsEditing(true); // Always open in edit mode
        else setIsEditing(false);
    }, [isOpen]);

    const handleSave = async () => {
        setSaveLoading(true);
        try {
            await onSaveProfile(userData);
            setIsEditing(false);
        } catch (error) {
            console.error(error);
        } finally {
            setSaveLoading(false);
        }
    };

    if (!isOpen) return null

    // Login View
    if (!isAuth) {
        return (
            <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
                <ErrorBoundary>
                    <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden border border-gray-200 flex flex-col animate-scale-up">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex justify-between items-center shadow-md">
                            <h2 className="font-bold text-lg leading-tight">Resumator AI</h2>
                            <button onClick={onClose} className="text-white/70 hover:text-white rounded-full p-1">✕</button>
                        </div>

                        <div className="p-8 flex flex-col items-center text-center space-y-6">
                            <div className="bg-blue-50 p-4 rounded-full">
                                <span className="text-4xl">🔒</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Authentication Required</h3>
                                <p className="text-gray-500 text-sm">Please sign in to access the Resume Generator and Match Score features.</p>
                            </div>

                            <button
                                onClick={onLogin}
                                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 px-6 py-3 rounded-lg shadow-sm hover:bg-gray-50 transition font-medium text-gray-700"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="Google" />
                                Sign in with Google
                            </button>
                        </div>
                    </div>
                </ErrorBoundary>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in font-sans">
            <ErrorBoundary>
                <div className="bg-white rounded-xl shadow-2xl w-[450px] overflow-hidden border border-gray-200 flex flex-col max-h-[90vh] animate-scale-up">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex justify-between items-center shadow-md">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <span className="text-xl">🚀</span>
                            </div>
                            <div>
                                <h2 className="font-bold text-lg leading-tight">Resumator AI</h2>
                                <p className="text-xs text-blue-100/80">Job Application Assistant</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onLogout}
                                title="Logout"
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-2 h-8 w-8 flex items-center justify-center transition-colors text-xs"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                </svg>
                            </button>
                            <button
                                onClick={onClose}
                                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-2 h-8 w-8 flex items-center justify-center transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1 bg-gray-50/50 space-y-6">

                        {/* Job Info Card */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
                            <div className="absolute top-0 right-0 p-2 opacity-5">
                                <span className="text-6xl">🏢</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Target Position</p>
                            <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">
                                {jobData?.title || "Detecting Job..."}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                                <span>{jobData?.company || "Company Unknown"}</span>
                                {jobData?.platform && <span className="bg-indigo-50 px-2 py-0.5 rounded-full text-xs border border-indigo-100">{jobData.platform}</span>}
                            </div>
                        </div>

                        {/* User Input Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Profile</p>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                                        </svg>
                                        Edit Details
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="text-xs text-gray-500 hover:text-gray-700"
                                            disabled={saveLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                                            disabled={saveLoading}
                                        >
                                            {saveLoading ? "Saving..." : "Save"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Contact Details Section */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Contact Information</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-400 text-xs">📧</span>
                                        <input
                                            className={`w-full pl-9 p-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 ${isEditing ? 'border-blue-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                            placeholder="Email"
                                            value={userData.email || ""}
                                            onChange={e => setUserData({ ...userData, email: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-400 text-xs">📱</span>
                                        <input
                                            className={`w-full pl-9 p-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 ${isEditing ? 'border-blue-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                            placeholder="Phone"
                                            value={userData.phone || ""}
                                            onChange={e => setUserData({ ...userData, phone: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-400 text-xs">🔗</span>
                                    <input
                                        className={`w-full pl-9 p-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 ${isEditing ? 'border-blue-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                        placeholder="LinkedIn URL"
                                        value={userData.linkedin || ""}
                                        onChange={e => setUserData({ ...userData, linkedin: e.target.value })}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>

                            {/* Preferences Section */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Preferences</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-400 text-xs">📍</span>
                                        <input
                                            className={`w-full pl-9 p-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 ${isEditing ? 'border-blue-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                            placeholder="Location"
                                            value={userData.location || ""}
                                            onChange={e => setUserData({ ...userData, location: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-gray-400 text-xs">⏳</span>
                                        <input
                                            className={`w-full pl-9 p-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 ${isEditing ? 'border-blue-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                            placeholder="Notice Period"
                                            value={userData.notice_period || ""}
                                            onChange={e => setUserData({ ...userData, notice_period: e.target.value })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-400 text-xs">💼</span>
                                    <select
                                        className={`w-full pl-9 p-2.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 appearance-none ${isEditing ? 'border-blue-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                        value={userData.job_type || "any"}
                                        onChange={e => setUserData({ ...userData, job_type: e.target.value })}
                                        disabled={!isEditing}
                                    >
                                        <option value="any">Any Job Type</option>
                                        <option value="remote">Remote</option>
                                        <option value="hybrid">Hybrid</option>
                                        <option value="onsite">On-site</option>
                                    </select>
                                </div>
                            </div>

                            {/* Professional Details Section */}
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-1">Professional Details</p>
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-400">👤</span>
                                    <input
                                        className={`w-full pl-10 p-3 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 ${isEditing ? 'border-blue-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                        placeholder="Full Name"
                                        value={userData.full_name || ""}
                                        onChange={e => setUserData({ ...userData, full_name: e.target.value })}
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="relative">
                                    <textarea
                                        className={`w-full p-3 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y min-h-[100px] placeholder:text-gray-400 ${isEditing ? 'border-blue-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                        rows={4}
                                        placeholder="Experience Summary..."
                                        value={userData.experience || ""}
                                        onChange={e => setUserData({ ...userData, experience: e.target.value })}
                                        disabled={!isEditing}
                                    />
                                    {!isEditing && (
                                        <div className="absolute bottom-2 right-2 text-[10px] text-gray-400 pointer-events-none bg-white/80 px-1 rounded">
                                            Read Only
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Skills</p>
                                    <textarea
                                        className={`w-full p-3 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y min-h-[60px] placeholder:text-gray-400 ${isEditing ? 'border-blue-300' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                                        rows={2}
                                        placeholder="React, TypeScript, etc..."
                                        value={userData.skills || ""}
                                        onChange={e => setUserData({ ...userData, skills: e.target.value })}
                                        disabled={!isEditing}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Match Result Display */}
                        {matchResult && (
                            <div className="bg-white p-5 rounded-xl border border-indigo-100 shadow-sm animate-slide-up relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${matchResult.score >= 70 ? 'bg-green-500' :
                                    matchResult.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}></div>

                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">📊</span>
                                        <h4 className="font-bold text-gray-700">Match Analysis</h4>
                                    </div>
                                    <div className={`flex items-baseline gap-1 ${matchResult.score >= 70 ? 'text-green-600' :
                                        matchResult.score >= 40 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                        <span className="text-3xl font-black">{matchResult.score}</span>
                                        <span className="text-sm font-bold">%</span>
                                    </div>
                                </div>

                                <div className="w-full bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${matchResult.score >= 70 ? 'bg-green-500' :
                                            matchResult.score >= 40 ? 'bg-yellow-400' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${matchResult.score}%` }}
                                    ></div>
                                </div>

                                <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/50">
                                    <p className="text-sm text-gray-600 leading-relaxed italic">
                                        "{matchResult.reasoning}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-5 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] space-y-3">
                        {genStatus && (
                            <div className="text-center mb-2">
                                <span className={`text-xs font-medium px-3 py-1 rounded-full ${genStatus.includes("Error") ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                                    }`}>
                                    {genStatus}
                                </span>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={onCheckMatch}
                                disabled={loading || !jobData}
                                className="flex-1 bg-white text-indigo-600 border border-indigo-200 py-3 rounded-lg font-bold hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2 shadow-sm"
                            >
                                {loading && !matchResult ? "Analyzing..." : "📊 Check Match"}
                            </button>
                            <button
                                onClick={onGenerate}
                                disabled={loading || !jobData}
                                className="flex-[1.5] bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-200"
                            >
                                {loading && !matchResult ? (
                                    <>
                                        <span className="animate-spin">⌛</span> Generating...
                                    </>
                                ) : (
                                    <>✨ Generate PDF</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        </div>
    )
}

export default ResumeModal
