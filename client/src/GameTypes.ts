import { Timestamp } from '@holochain/client'
import { EntryHashB64, AgentPubKeyB64, ActionHashB64 } from '@holochain-open-dev/core-types'

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

export type Signal = {
    gameHash: EntryHashB64
    message: Message
}

export type NewComment = {
    agentKey: string
    comment: string
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

export interface GameSettingsData {
    topic: string
    topicGroup: string
    topicImageUrl: string
    description: string
    backgroundImage: string
    backgroundVideoUrl: string
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
    comment: string
}

export interface JoinGameInput {
    agent: AgentPubKeyB64
    entryHash: EntryHashB64
}

export interface CreateOutput {
    headerHash: ActionHashB64
    entryHash: EntryHashB64
}

export interface GameOutput {
    headerHash: ActionHashB64
    entryHash: EntryHashB64
    game: GameSettingsData
    author: AgentPubKeyB64
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
    agent: AgentPubKeyB64
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
    agent: AgentPubKeyB64
    bead: Bead
    timestamp: Timestamp
}
