import { Timestamp } from "@holochain/client";
import { EntryHashB64, AgentPubKeyB64, HeaderHashB64 } from "@holochain-open-dev/core-types";


export type Signal =
  | {
    attestationHash: EntryHashB64, message: {type: "NewGame", content: GameOutput}
  }

export interface GameSettingsData {
    gameId: number,
    numberOfTurns: number,
    moveDuration: number,
    introDuration: number,
    intervalDuration: number,
    outroDuration: number,
    playerOrder: string // user id's seperated by commas ('25,2,109,38')
}

export interface GameData {
    id: number
    numberOfTurns: number,
    moveDuration: number,
    introDuration: number,
    intervalDuration: number,
    outroDuration: number,
    locked: boolean
    topic: string
    topicGroup: string | null
    topicImage: string | null
    backgroundImage: string | null
    backgroundVideo: string | null
    backgroundVideoStartTime: number | null
    GlassBeadGameComments: Comment[]
    GlassBeads: Bead[]
}

// TODO: Eric added this, but James needs to consider if it is necessary
export interface JoinGameInput {
    agent: AgentPubKeyB64,
    entryHash: EntryHashB64
}

// TODO: Eric added this, but James needs to consider if it is necessary
export interface CreateOutput {
    headerHash: HeaderHashB64,
    entryHash: EntryHashB64
}

// TODO: Eric added this, but James needs to consider if it is necessary
export interface GameOutput {
    headerHash: HeaderHashB64,
    entryHash: EntryHashB64,
    game: GameSettingsData,
    author: AgentPubKeyB64,
}

export interface Comment {
    id: number
    text: string
    createdAt: Date
    updatedAt: Date
    user: {
        handle: string
        name: string
        flagImagePath: string
    }
}

export interface NewCommentData {
    gameId: number
    userId: number
    text: string
}

export interface CommentInput {
    entryHash: EntryHashB64,
    comment: string,
}

export interface CommentOutput {
    headerHash: HeaderHashB64,
    entryHash: EntryHashB64,
    agent: AgentPubKeyB64,
    comment: string,
    timestamp: Timestamp,
}

export interface Bead {
    id: number
    index: number
    beadUrl: string
    createdAt: Date
    updatedAt: Date
    user: {
        handle: string
        name: string
        flagImagePath: string
    }
}

export interface BeadInput {
    entryHash: EntryHashB64,
    bead: Bead,
}

export interface BeadOutput {
    headerHash: HeaderHashB64,
    entryHash: EntryHashB64,
    agent: AgentPubKeyB64,
    bead: Bead,
    timestamp: Timestamp,
}