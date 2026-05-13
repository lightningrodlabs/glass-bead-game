import React, { useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ProfilesStore } from '@holochain-open-dev/profiles'
import App from './App'
import GlassBeadGameService from '@src/glassbeadgame.service'
import { AppContext, AppContextValue } from '@src/contexts'
import { connect } from '@src/connect'
import '@holochain-open-dev/profiles/dist/elements/profiles-context.js'
import '@holochain-open-dev/profiles/dist/elements/profile-prompt.js'
import '@shoelace-style/shoelace/dist/themes/light.css'
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
import './styles/App.scss'
import 'overlayscrollbars/overlayscrollbars.css'

setBasePath('/shoelace')

const ROLE_NAME = 'glassbeadgame'

const ProfilesContextProvider = (props: {
    store: ProfilesStore
    children: React.ReactNode
}): JSX.Element => {
    const setRef = useCallback(
        (el: HTMLElement | null) => {
            if (el) (el as any).store = props.store
        },
        [props.store]
    )
    return <profiles-context ref={setRef as any}>{props.children}</profiles-context>
}

const ProfilePromptGate = (props: {
    store: ProfilesStore
    children: React.ReactNode
}): JSX.Element => {
    const setRef = useCallback(
        (el: HTMLElement | null) => {
            if (el) (el as any).store = props.store
        },
        [props.store]
    )
    return <profile-prompt ref={setRef as any}>{props.children}</profile-prompt>
}

function Bootstrap(): JSX.Element {
    const [ctx, setCtx] = useState<AppContextValue | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        connect()
            .then(({ client, weaveClient, profilesClient, mode }) => {
                const service = new GlassBeadGameService(client, ROLE_NAME)
                const profilesStore = new ProfilesStore(profilesClient)
                setCtx({ client, weaveClient, service, profilesStore, mode })
            })
            .catch((e) => {
                console.error('[GBG] Failed to connect:', e)
                setError(e?.message ?? String(e))
            })
    }, [])

    if (error) return <div style={{ padding: 40 }}>Failed to connect: {error}</div>
    if (!ctx) return <div style={{ padding: 40 }}>Connecting&hellip;</div>

    const tree = (
        <AppContext.Provider value={ctx}>
            <App />
        </AppContext.Provider>
    )

    return (
        <ProfilesContextProvider store={ctx.profilesStore}>
            {ctx.mode === 'weave' ? (
                tree
            ) : (
                <ProfilePromptGate store={ctx.profilesStore}>{tree}</ProfilePromptGate>
            )}
        </ProfilesContextProvider>
    )
}

const root = createRoot(document.getElementById('root')!)
root.render(<Bootstrap />)
