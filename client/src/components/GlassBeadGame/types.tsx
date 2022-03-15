import { Timestamp } from "@holochain/client";
import { EntryHashB64, AgentPubKeyB64, HeaderHashB64 } from "@holochain-open-dev/core-types";


export type Signal =
  | {
    attestationHash: EntryHashB64, message: {type: "NewGame", content: GameOutput}
  }
  

export interface Game {
    topic : string,
    topicGroup: string,
    topicImageUrl: string,
    backgroundVideoUrl: string,
    backgroundVideoStartTime: number,
    locked: boolean,
    introDuration: number,
    outroDuration: number,
    numberOfTurns: number,
    moveDuration: number,
    intervalDuration: number,
}

export interface JoinGameInput {
    agent: AgentPubKeyB64,
    entryHash: EntryHashB64
}

export interface CreateOutput {
    headerHash: HeaderHashB64,
    entryHash: EntryHashB64
}

export interface GameOutput {
    headerHash: HeaderHashB64,
    entryHash: EntryHashB64,
    game: Game,
    author: AgentPubKeyB64,
}

export interface Comment {
    comment : string,
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
    content : string,
    index: number,
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
