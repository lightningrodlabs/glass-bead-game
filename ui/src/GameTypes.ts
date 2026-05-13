import type { Timestamp, EntryHash, AgentPubKey, ActionHash } from '@holochain/client'

export type Message =
    | { type: 'NewPlayer'; content: AgentPubKey }
    | { type: 'NewComment'; content: NewComment }
    | { type: 'NewTopic'; content: NewTopic }
    | { type: 'NewTopicImage'; content: NewTopicImage }
    | { type: 'NewBackground'; content: NewBackground }
    | { type: 'StartGame'; content: StartGame }
    | { type: 'StopGame'; content: StopGame }
    | { type: 'LeaveGame'; content: LeaveGame }
    | { type: 'NewBead'; content: NewBead }
    | { type: 'NewSignalRequest'; content: NewSignalRequest }
    | { type: 'NewSignalResponse'; content: NewSignalResponse }
    | { type: 'RefreshRequest'; content: RefreshRequest }
    | { type: 'StreamDisconnected'; content: StreamDisconnected }

export type Signal = {
    gameHash: EntryHash
    message: Message
}

export type NewComment = {
    agentKey: AgentPubKey
    text: string
}

export type NewTopic = {
    agentKey: AgentPubKey
    topic: string
}

export type NewTopicImage = {
    agentKey: AgentPubKey
    topicImageUrl: string
}

export type NewBackground = {
    agentKey: AgentPubKey
    subType: string
    url: string
    startTime: number
}

export type StartGame = {
    agentKey: AgentPubKey
    data: string
}

export type StopGame = {
    agentKey: AgentPubKey
}

export type LeaveGame = {
    agentKey: AgentPubKey
}

export type NewBead = {
    agentKey: AgentPubKey
    audio: Uint8Array
    index: number
}

export type NewSignalRequest = {
    agentKey: AgentPubKey
    signal: string
}

export type NewSignalResponse = {
    agentKey: AgentPubKey
    signal: string
}

export type RefreshRequest = {
    agentKey: AgentPubKey
}

export type StreamDisconnected = {
    agentKey: AgentPubKey
}

export interface GameSettingsData {
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

export interface IComment {
    entryHash: EntryHash
    text: string
}

export interface JoinGameInput {
    agentKey: AgentPubKey
    entryHash: EntryHash
}

export interface CreateOutput {
    actionHash: ActionHash
    entryHash: EntryHash
}

export interface CreateGameOutput {
    actionHash: ActionHash
    settingsActionHash: ActionHash
    entryHash: EntryHash
}

export interface GameOutput {
    entryHash: EntryHash
    creator: AgentPubKey
    created: Timestamp
    settings: GameSettingsData
}

export interface UpdateGameInput {
    entryHash: EntryHash
    newSettings: GameSettingsData
}

export interface CommentInput {
    entryHash: EntryHash
    text: string
}

export interface CommentOutput {
    actionHash: ActionHash
    entryHash: EntryHash
    agentKey: AgentPubKey
    text: string
    timestamp: Timestamp
}

export interface Bead {
    audio: Uint8Array
    index: number
}

export interface BeadInput {
    entryHash: EntryHash
    bead: Bead
}

export interface BeadOutput {
    actionHash: ActionHash
    entryHash: EntryHash
    agentKey: AgentPubKey
    bead: Bead
    timestamp: Timestamp
}
