export const getPlatformStyle = (platform: string) => {
    // Default / Fallback
    const base = {
        zIndex: 9999,
        display: 'inline-flex',
        alignItems: 'center',
        height: 'fit-content',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        fontFamily: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Fira Sans", Ubuntu, Oxygen, "Oxygen Sans", Cantarell, "Droid Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Lucida Grande", Helvetica, Arial, sans-serif',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }

    if (platform.includes("linkedin")) {
        return {
            ...base,
            backgroundColor: 'white',
            color: '#0a66c2', // LinkedIn Blue text for inverted look often used for secondary actions
            border: '1px solid #0a66c2',
            borderRadius: '24px', // Pill shape
            padding: '6px 16px',
            fontSize: '1.6rem', // LinkedIn uses rems often, roughly 16px
            marginLeft: '12px',
        }
    }

    if (platform.includes("indeed")) {
        return {
            ...base,
            backgroundColor: 'white',
            color: '#2557a7',
            border: '1px solid #2557a7',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: '700',
            marginLeft: '12px',
        }
    }

    if (platform.includes("naukri")) {
        return {
            ...base,
            backgroundColor: 'white',
            color: '#FF7555',
            border: '1px solid #FF7555',
            borderRadius: '20px',
            padding: '8px 20px',
            fontSize: '14px',
            fontWeight: '700',
            marginLeft: '12px',
        }
    }

    // Generic Fallback
    return {
        ...base,
        background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
        color: 'white',
        borderRadius: '24px',
        padding: '8px 20px',
        marginLeft: '12px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
    }
}
