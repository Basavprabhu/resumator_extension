import React, { useEffect } from "react"

interface ToastProps {
    message: string
    type: 'error' | 'success' | 'info'
    onClose: () => void
}

const Toast = ({ message, type, onClose }: ToastProps) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000)
        return () => clearTimeout(timer)
    }, [onClose])

    const bgColors = {
        error: '#ef4444',
        success: '#22c55e',
        info: '#3b82f6'
    }

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: bgColors[type],
            color: 'white',
            padding: '10px 20px',
            borderRadius: '50px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
            zIndex: 1000000,
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeInUp 0.3s ease-out'
        }}>
            <span>{type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}</span>
            <span>{message}</span>
        </div>
    )
}

export default Toast
