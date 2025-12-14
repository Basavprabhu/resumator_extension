import React from "react"

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true }
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("Resumator UI Error:", error, errorInfo)
    }

    render() {
        if (this.state.hasError) {
            return <div style={{ padding: 10, color: 'red', background: '#fff', border: '1px solid red', borderRadius: 4 }}>UI Error. Please refresh.</div>
        }
        return this.props.children
    }
}

export default ErrorBoundary
