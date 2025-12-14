import React, { useState } from "react"
import { getPlatformStyle } from "../utils/platform"
// @ts-ignore
import iconBase64 from "data-base64:../../assets/icon.png"

const InlineMatchButton = ({ onClick, platform }: { onClick: () => void, platform: string }) => {
    const style = getPlatformStyle(platform.toLowerCase())
    const [hover, setHover] = useState(false)

    // Match Score specific styling augmentations
    const finalStyle = {
        ...style,
        transform: hover ? 'translateY(-1px)' : 'translateY(0)',
        boxShadow: hover ? '0 4px 8px rgba(0,0,0,0.15)' : style.boxShadow,
        opacity: hover ? 0.95 : 1,
        paddingLeft: '12px', // Adjust padding for image
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px'
    }

    return (
        <button
            onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onClick()
            }}
            className="resumator-inline-match-btn"
            style={finalStyle as any}
            onMouseOver={() => setHover(true)}
            onMouseOut={() => setHover(false)}
        >
            <img
                src={iconBase64}
                alt="Resumator"
                style={{
                    width: '20px',
                    height: '20px',
                    objectFit: 'contain',
                    borderRadius: '4px'
                }}
            />
            <span>Check Match Score</span>
        </button>
    )
}

export default InlineMatchButton
