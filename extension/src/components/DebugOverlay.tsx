import React from "react"

export type DebugLog = { ts: string, msg: string }

const DebugOverlay = ({ logs, jobData, status }: { logs: DebugLog[], jobData: any, status: string }) => {
    const DEBUG = false // Hardcoded toggle, generally off in prod

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

export default DebugOverlay
