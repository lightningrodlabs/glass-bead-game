import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import GlassBeadGameService from '@src/glassbeadgame.service'
import { AppContext, AppContextValue } from '@src/contexts'
import { connect } from '@src/connect'
import './styles/App.scss'
import 'overlayscrollbars/overlayscrollbars.css'

const ROLE_NAME = 'glassbeadgame'

function Bootstrap(): JSX.Element {
    const [ctx, setCtx] = useState<AppContextValue | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        connect()
            .then(({ client, weaveClient, mode }) => {
                const service = new GlassBeadGameService(client, ROLE_NAME)
                setCtx({ client, weaveClient, service, mode })
            })
            .catch((e) => {
                console.error('[GBG] Failed to connect:', e)
                setError(e?.message ?? String(e))
            })
    }, [])

    if (error) return <div style={{ padding: 40 }}>Failed to connect: {error}</div>
    if (!ctx) return <div style={{ padding: 40 }}>Connecting&hellip;</div>

    return (
        <AppContext.Provider value={ctx}>
            <App />
        </AppContext.Provider>
    )
}

const root = createRoot(document.getElementById('root')!)
root.render(<Bootstrap />)
