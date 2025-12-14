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
    genStatus
}: ResumeModalProps) => {

    if (!isOpen) return null

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
                        <button
                            onClick={onClose}
                            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full p-2 h-8 w-8 flex items-center justify-center transition-colors"
                        >
                            ✕
                        </button>
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
                            <div className="flex justify-between items-baseline">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Profile</p>
                            </div>

                            <div className="space-y-3">
                                <div className="relative">
                                    <span className="absolute left-3 top-3 text-gray-400">👤</span>
                                    <input
                                        className="w-full pl-10 p-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                                        placeholder="Full Name"
                                        value={userData.full_name}
                                        onChange={e => setUserData({ ...userData, full_name: e.target.value })}
                                    />
                                </div>

                                <div className="relative">
                                    <textarea
                                        className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y min-h-[100px] placeholder:text-gray-400"
                                        rows={4}
                                        placeholder="Paste your resume text, skills, or LinkedIn summary here..."
                                        value={userData.skills}
                                        onChange={e => setUserData({ ...userData, skills: e.target.value })}
                                    />
                                    <div className="absolute bottom-2 right-2 text-[10px] text-gray-300 pointer-events-none">
                                        Skills & Exp
                                    </div>
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
