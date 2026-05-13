import { AppClient, AppWebsocket } from '@holochain/client'
import { WeaveClient, isWeaveContext, initializeHotReload } from '@theweave/api'
import { ProfilesClient } from '@holochain-open-dev/profiles'

export type ConnectionMode = 'tauri' | 'weave' | 'browser'

const ROLE_NAME = 'glassbeadgame'
const PROFILES_ZOME_NAME = 'profiles'

export interface Connection {
    client: AppClient
    weaveClient: WeaveClient | undefined
    profilesClient: ProfilesClient
    mode: ConnectionMode
}

export async function connect(): Promise<Connection> {
    if (import.meta.env.DEV && !(window as any).__HC_LAUNCHER_ENV__ && !isWeaveContext()) {
        try {
            await initializeHotReload()
        } catch {
            /* not in weave dev */
        }
    }

    if (isWeaveContext()) {
        const weaveClient = await WeaveClient.connect()
        if (
            weaveClient.renderInfo.type === 'applet-view' &&
            weaveClient.renderInfo.view.type === 'main'
        ) {
            return {
                client: weaveClient.renderInfo.appletClient,
                weaveClient,
                profilesClient: weaveClient.renderInfo.profilesClient,
                mode: 'weave',
            }
        }
        throw new Error(`Unsupported Weave render context: ${weaveClient.renderInfo.type}`)
    }

    const client = await AppWebsocket.connect()
    const profilesClient = new ProfilesClient(client, ROLE_NAME, PROFILES_ZOME_NAME)
    const mode: ConnectionMode = (window as any).__HC_LAUNCHER_ENV__ ? 'tauri' : 'browser'
    return { client, weaveClient: undefined, profilesClient, mode }
}
