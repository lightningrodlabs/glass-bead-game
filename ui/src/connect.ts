import { AppClient, AppWebsocket } from '@holochain/client'
import { WeaveClient, isWeaveContext, initializeHotReload } from '@theweave/api'

export type ConnectionMode = 'tauri' | 'weave' | 'browser'

export interface Connection {
    client: AppClient
    weaveClient: WeaveClient | undefined
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
                mode: 'weave',
            }
        }
        throw new Error(`Unsupported Weave render context: ${weaveClient.renderInfo.type}`)
    }

    const client = await AppWebsocket.connect()
    const mode: ConnectionMode = (window as any).__HC_LAUNCHER_ENV__ ? 'tauri' : 'browser'
    return { client, weaveClient: undefined, mode }
}
