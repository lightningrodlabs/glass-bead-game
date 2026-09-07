import type { EntryHash, AgentPubKey, ActionHash } from '@holochain/client'

/** Mirrors GameSettings in dnas/glassbeadgame/zomes/integrity/glassbeadgame/src/lib.rs
 *  (the struct carries #[serde(rename_all = "camelCase")]). */
export interface GameSettings {
    topic: string
    topicGroup: string
    topicImageUrl: string
    description: string
    backgroundImage: string
    backgroundVideo: string
    backgroundVideoStartTime: number
    locked: boolean
    introDuration: number
    outroDuration: number
    numberOfTurns: number
    moveDuration: number
    intervalDuration: number
}

export function sampleSettings(overrides: Partial<GameSettings> = {}): GameSettings {
    return {
        topic: 'The nature of play',
        topicGroup: 'archetopics',
        topicImageUrl: '',
        description: 'a test game',
        backgroundImage: '',
        backgroundVideo: '',
        backgroundVideoStartTime: 0,
        locked: false,
        introDuration: 5,
        outroDuration: 5,
        numberOfTurns: 3,
        moveDuration: 30,
        intervalDuration: 5,
        ...overrides,
    }
}

export interface CreateGameOutput {
    actionHash: ActionHash
    settingsActionHash: ActionHash
    entryHash: EntryHash
}

export interface CreateOutput {
    actionHash: ActionHash
    entryHash: EntryHash
}

export interface GameOutput {
    entryHash: EntryHash
    creator: AgentPubKey
    created: number
    settings: GameSettings
}

export interface CommentOutput {
    actionHash: ActionHash
    entryHash: EntryHash
    agentKey: AgentPubKey
    text: string
    timestamp: number
}

export interface BeadOutput {
    actionHash: ActionHash
    entryHash: EntryHash
    agentKey: AgentPubKey
    bead: { audio: Uint8Array; index: number }
    timestamp: number
}

export const ZOME = 'glassbeadgame'
