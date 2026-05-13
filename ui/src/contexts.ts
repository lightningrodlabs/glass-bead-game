import { createContext } from 'react'
import type { AppClient } from '@holochain/client'
import type { WeaveClient } from '@theweave/api'
import type { ProfilesStore } from '@holochain-open-dev/profiles'
import type GlassBeadGameService from '@src/glassbeadgame.service'

export interface AppContextValue {
    client: AppClient
    weaveClient: WeaveClient | undefined
    service: GlassBeadGameService
    profilesStore: ProfilesStore
    mode: 'tauri' | 'weave' | 'browser'
}

export const AppContext = createContext<AppContextValue | null>(null)
