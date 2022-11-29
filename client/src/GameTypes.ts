import { Timestamp } from '@holochain/client'
import { EntryHashB64, AgentPubKeyB64, ActionHashB64 } from '@holochain-open-dev/core-types'

export type Player = {
    agentKey: string
    name: string
    image: string
}

export type Message =
    | {
          type: 'NewPlayer'
          content: AgentPubKeyB64
      }
    | {
          type: 'NewComment'
          content: NewComment
      }
    | {
          type: 'NewTopic'
          content: NewTopic
      }
    | {
          type: 'NewTopicImage'
          content: NewTopicImage
      }
    | {
          type: 'NewBackground'
          content: NewBackground
      }
    | {
          type: 'StartGame'
          content: StartGame
      }
    | {
          type: 'StopGame'
          content: StopGame
      }
    | {
          type: 'LeaveGame'
          content: LeaveGame
      }
    | {
          type: 'NewBead'
          content: NewBead
      }
    | {
          type: 'NewSignalRequest'
          content: NewSignalRequest
      }
    | {
          type: 'NewSignalResponse'
          content: NewSignalResponse
      }
    | {
          type: 'RefreshRequest'
          content: RefreshRequest
      }
    | {
          type: 'StreamDisconnected'
          content: StreamDisconnected
      }
// | {
//       type: 'NewGame'
//       content: NewGame
//   }

export type Signal = {
    gameHash: EntryHashB64
    message: Message
}

export type NewComment = {
    player: Player
    text: string
}

export type NewTopic = {
    agentKey: string
    topic: string
}

export type NewTopicImage = {
    agentKey: string
    topicImageUrl: string
}

export type NewBackground = {
    agentKey: string
    subType: string
    url: string
    startTime: number
}

export type StartGame = {
    agentKey: string
    data: string
}

export type StopGame = {
    agentKey: string
}

export type LeaveGame = {
    agentKey: string
}

export type NewBead = {
    agentKey: string
    audio: any
    index: number
}

export type NewSignalRequest = {
    player: Player
    signal: string
}

export type NewSignalResponse = {
    player: Player
    signal: string
}

export type RefreshRequest = {
    agentKey: string
}

export type StreamDisconnected = {
    agentKey: string
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

export interface GameData {
    id: number
    numberOfTurns: number
    moveDuration: number
    introDuration: number
    intervalDuration: number
    outroDuration: number
    locked: boolean
    topic: string
    topicGroup: string | null
    topicImage: string | null
    description: string
    backgroundImage: string | null
    backgroundVideo: string | null
    backgroundVideoStartTime: number | null
    GlassBeadGameComments: Comment[]
    GlassBeads: Bead[]
}

export interface IComment {
    entryHash: EntryHashB64
    text: string
}

export interface JoinGameInput {
    agentKey: AgentPubKeyB64
    entryHash: EntryHashB64
}

export interface CreateOutput {
    headerHash: ActionHashB64
    entryHash: EntryHashB64
}

export interface CreateGameOutput {
    actionHash: ActionHashB64
    entryHash: EntryHashB64
}

export interface GameOutput {
    entryHash: EntryHashB64
    settings: GameSettingsData
    // author: AgentPubKeyB64
}

export interface UpdateGameInput {
    entryHash: EntryHashB64
    newSettings: GameSettingsData
}

export interface NewCommentData {
    gameId: number
    userId: number
    text: string
}

export interface CommentInput {
    entryHash: EntryHashB64
    comment: string
}

export interface CommentOutput {
    headerHash: ActionHashB64
    entryHash: EntryHashB64
    agentKey: AgentPubKeyB64
    comment: string
    timestamp: Timestamp
}

export interface Bead {
    entryHash: EntryHashB64
    agentKey: string
    audio: any
    index: number
}

export interface BeadInput {
    entryHash: EntryHashB64
    bead: Bead
}

export interface BeadOutput {
    headerHash: ActionHashB64
    entryHash: EntryHashB64
    agentKey: AgentPubKeyB64
    bead: Bead
    timestamp: Timestamp
}
