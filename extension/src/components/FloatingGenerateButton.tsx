import React, { useState } from "react"
// @ts-ignore
import iconBase64 from "data-base64:../../assets/icon.png"

const FloatingGenerateButton = ({ onClick, visible }: { onClick: () => void, visible: boolean }) => {
    const [hover, setHover] = useState(false)

    if (!visible) return null

    return (
        <div className="fixed bottom-5 right-5 z-[2147483647] font-sans">
            <button
                onClick={onClick}
                onMouseOver={() => setHover(true)}
                onMouseOut={() => setHover(false)}
                className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-3 pr-6 rounded-full shadow-2xl flex items-center gap-3 transition-all transform hover:scale-105 hover:shadow-blue-500/50"
                style={{
                    boxShadow: hover ? '0 10px 25px -5px rgba(59, 130, 246, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}
            >
                <div className="bg-white/90 p-1.5 rounded-full flex items-center justify-center shadow-sm">
                    <img
                        src={iconBase64}
                        alt="AI"
                        className="w-8 h-8 object-contain"
                        style={{ width: '28px', height: '28px' }}
                    />
                </div>
                <div className="flex flex-col items-start">
                    <span className="font-bold text-sm leading-tight">Generate</span>
                    <span className="text-xs text-blue-100 font-medium">Resume PDF</span>
                </div>
            </button>
        </div>
    )
}

export default FloatingGenerateButton
