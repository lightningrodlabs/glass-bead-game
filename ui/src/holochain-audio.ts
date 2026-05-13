// Holochain-signals voice transport, ported from `presence/ui/src/room/modules/voice.ts`.
// Send path: getUserMedia(audio) -> MediaStreamTrackProcessor -> AudioEncoder (Opus 24 kbps)
//            -> base64 JSON frame -> fanout via `notify` ModuleData to all targets.
// Recv path: AudioDecoder per peer -> AudioBufferSourceNode scheduled into a small
//            jitter buffer (80 ms). Per-peer peak level captured for the UI meter.

import { encodeHashToBase64 } from '@holochain/client'
import type { AgentPubKey } from '@holochain/client'

type AnyEncodedAudioChunk = any
type AnyAudioData = any

export interface VoiceFramePayload {
    seq: number
    ts: number
    type: 'key' | 'delta'
    data: string
}

interface PeerState {
    decoder: any
    nextPlaybackTime: number
    lastSeq: number
}

const JITTER_BUFFER_MS = 80
const PLAYBACK_RESET_DRIFT_MS = 400
export const HOLOCHAIN_AUDIO_MSG_TYPE = 'voice'
export const HOLOCHAIN_AUDIO_ANNOUNCE_TYPE = 'hc-audio-announce'
export const HOLOCHAIN_AUDIO_MUTE_TYPE = 'hc-audio-mute'

export type SendFrame = (
    msgType: string,
    payload: string,
    targets: AgentPubKey[]
) => void

export class HolochainAudio {
    private send: SendFrame
    private getTargets: () => AgentPubKey[]

    private stream: MediaStream | null = null
    private audioContext: AudioContext | null = null
    private encoder: any = null
    private encoderReader: ReadableStreamDefaultReader<any> | null = null
    private pipelineGeneration = 0
    private seq = 0

    private analyserNode: AnalyserNode | null = null
    private analyserBuffer: Float32Array | null = null
    private analyserSourceNode: MediaStreamAudioSourceNode | null = null

    private peers = new Map<string, PeerState>()
    private _muted = false
    private _running = false

    /** Per-peer peak audio level [0..1] from the most recent decoded frame. */
    peerAudioLevels = new Map<string, number>()

    /**
     * Peers who have announced themselves as connected (via hc-audio-announce
     * join) or from whom we've received at least one voice frame. Used as the
     * source of truth for "is connected"; voice-arrival alone is too lossy to
     * be the only signal.
     */
    private announcedPeers = new Set<string>()

    constructor(opts: { send: SendFrame; getTargets: () => AgentPubKey[] }) {
        this.send = opts.send
        this.getTargets = opts.getTargets
    }

    get running(): boolean {
        return this._running
    }

    get muted(): boolean {
        return this._muted
    }

    async start(): Promise<boolean> {
        if (this._running) return true
        const g: any = globalThis as any
        if (!g.AudioEncoder || !g.MediaStreamTrackProcessor) {
            console.error('holochain-audio: WebCodecs not available in this browser')
            return false
        }
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        } catch (e) {
            console.error('holochain-audio: getUserMedia failed', e)
            return false
        }
        const track = this.stream.getAudioTracks()[0]
        if (!track) {
            this.stopStream()
            return false
        }

        const ctx: AudioContext = new (g.AudioContext || g.webkitAudioContext)()
        this.audioContext = ctx
        try {
            await ctx.resume()
        } catch {}

        const analyser = ctx.createAnalyser()
        analyser.fftSize = 512
        this.analyserNode = analyser
        this.analyserSourceNode = ctx.createMediaStreamSource(this.stream)
        this.analyserSourceNode.connect(analyser)
        this.analyserBuffer = new Float32Array(analyser.fftSize)

        try {
            this.encoder = new g.AudioEncoder({
                output: (chunk: AnyEncodedAudioChunk) => this.handleEncodedChunk(chunk),
                error: (e: any) => console.error('holochain-audio: encoder error', e),
            })
            this.encoder.configure({
                codec: 'opus',
                sampleRate: 48000,
                numberOfChannels: 1,
                bitrate: 24000,
            })
        } catch (e) {
            console.error('holochain-audio: encoder configure failed', e)
            this.stopStream()
            return false
        }

        try {
            const processor = new g.MediaStreamTrackProcessor({ track })
            this.encoderReader = processor.readable.getReader()
        } catch (e) {
            console.error('holochain-audio: failed to create MediaStreamTrackProcessor', e)
            this.stopStream()
            return false
        }

        this._running = true
        this._muted = false
        this.pipelineGeneration += 1
        const gen = this.pipelineGeneration
        this.pumpEncoder(gen).catch((e) => console.error('holochain-audio: pump error', e))
        return true
    }

    async stop(): Promise<void> {
        this._running = false
        this.pipelineGeneration += 1
        if (this.encoderReader) {
            try {
                await this.encoderReader.cancel()
            } catch {}
            this.encoderReader = null
        }
        if (this.encoder) {
            try {
                this.encoder.close()
            } catch {}
            this.encoder = null
        }
        for (const [, p] of this.peers) {
            try {
                p.decoder.close()
            } catch {}
        }
        this.peers.clear()
        this.peerAudioLevels.clear()
        this.announcedPeers.clear()
        this.stopStream()
        if (this.analyserSourceNode) {
            try {
                this.analyserSourceNode.disconnect()
            } catch {}
            this.analyserSourceNode = null
        }
        this.analyserNode = null
        this.analyserBuffer = null
        if (this.audioContext) {
            try {
                await this.audioContext.close()
            } catch {}
            this.audioContext = null
        }
        this.seq = 0
    }

    setMuted(muted: boolean): void {
        this._muted = muted
        if (!this.stream) return
        for (const t of this.stream.getAudioTracks()) t.enabled = !muted
    }

    /**
     * Returns the local mic peak level in [0..1] sampled from the live analyser.
     * Cheap to call from a render loop; allocates nothing per call.
     */
    getLocalLevel(): number {
        if (!this.analyserNode || !this.analyserBuffer || this._muted) return 0
        ;(this.analyserNode as any).getFloatTimeDomainData(this.analyserBuffer)
        let peak = 0
        const buf = this.analyserBuffer
        for (let i = 0; i < buf.length; i += 4) {
            const v = buf[i] < 0 ? -buf[i] : buf[i]
            if (v > peak) peak = v
        }
        return peak
    }

    getPeerLevel(agentKey: AgentPubKey): number {
        return this.peerAudioLevels.get(encodeHashToBase64(agentKey)) ?? 0
    }

    /** Number of peers known to be connected via the announce + voice handshake. */
    get connectedPeerCount(): number {
        return this.announcedPeers.size
    }

    /**
     * Broadcast an announce to a set of agents. Caller supplies the targets;
     * the module doesn't track room membership.
     *   action='join'  — sent on start; also sent in reply to a peer's join
     *                    so the new peer learns about us (handshake).
     *   action='leave' — sent on stop, best-effort.
     */
    announce(action: 'join' | 'leave', targets: AgentPubKey[]): void {
        if (targets.length === 0) return
        this.sendRaw(
            HOLOCHAIN_AUDIO_ANNOUNCE_TYPE,
            JSON.stringify({ action, muted: this._muted }),
            targets
        )
    }

    /** Broadcast current mute state to peers so their UI can show me muted. */
    broadcastMute(targets: AgentPubKey[]): void {
        if (targets.length === 0) return
        this.sendRaw(
            HOLOCHAIN_AUDIO_MUTE_TYPE,
            JSON.stringify({ muted: this._muted }),
            targets
        )
    }

    /**
     * Handle a peer announce. Called by the host on incoming hc-audio-announce
     * messages. Returns the action so the caller can decide whether to reply.
     */
    receiveAnnounce(fromAgent: AgentPubKey, payloadJson: string): 'join' | 'leave' | null {
        if (!this._running) return null
        const keyB64 = encodeHashToBase64(fromAgent)
        let parsed: { action?: 'join' | 'leave' }
        try {
            parsed = JSON.parse(payloadJson)
        } catch {
            return null
        }
        if (parsed.action === 'join') {
            this.announcedPeers.add(keyB64)
            return 'join'
        }
        if (parsed.action === 'leave') {
            this.announcedPeers.delete(keyB64)
            const state = this.peers.get(keyB64)
            if (state) {
                try {
                    state.decoder.close()
                } catch {}
            }
            this.peers.delete(keyB64)
            this.peerAudioLevels.delete(keyB64)
            return 'leave'
        }
        return null
    }

    receiveFrame(fromAgent: AgentPubKey, payloadJson: string): void {
        if (!this._running) return
        const keyB64 = encodeHashToBase64(fromAgent)
        // Receiving voice also implies the peer is connected — covers the
        // case where their announce was lost.
        this.announcedPeers.add(keyB64)
        let payload: VoiceFramePayload
        try {
            payload = JSON.parse(payloadJson)
        } catch {
            return
        }
        let state = this.peers.get(keyB64)
        if (!state) {
            const created = this.openPeer(keyB64)
            if (!created) return
            state = created
        }
        if (payload.seq <= state.lastSeq && state.lastSeq !== 0) return
        state.lastSeq = payload.seq

        const data = base64ToBytes(payload.data)
        const g: any = globalThis as any
        let encChunk: AnyEncodedAudioChunk
        try {
            encChunk = new g.EncodedAudioChunk({
                type: payload.type,
                timestamp: payload.ts,
                data,
            })
        } catch (e) {
            console.error('holochain-audio: EncodedAudioChunk failed', e)
            return
        }
        try {
            if (state.decoder.state === 'configured') state.decoder.decode(encChunk)
        } catch (e) {
            console.error('holochain-audio: decode failed', e)
        }
    }

    /** Remove decoder state for a peer that has left. */
    forgetPeer(agentKey: AgentPubKey): void {
        const keyB64 = encodeHashToBase64(agentKey)
        const state = this.peers.get(keyB64)
        if (state) {
            try {
                state.decoder.close()
            } catch {}
        }
        this.peers.delete(keyB64)
        this.peerAudioLevels.delete(keyB64)
        this.announcedPeers.delete(keyB64)
    }

    // ---- internals ----

    private stopStream(): void {
        if (this.stream) {
            this.stream.getTracks().forEach((t) => t.stop())
            this.stream = null
        }
    }

    private async pumpEncoder(gen: number): Promise<void> {
        while (this.encoderReader && this.encoder && gen === this.pipelineGeneration) {
            let read: ReadableStreamReadResult<any>
            try {
                read = await this.encoderReader.read()
            } catch {
                break
            }
            if (read.done) break
            if (gen !== this.pipelineGeneration) {
                try {
                    read.value?.close?.()
                } catch {}
                break
            }
            const audioData = read.value as AnyAudioData
            if (!audioData) continue
            try {
                if (this._muted) continue
                if (this.encoder && this.encoder.state === 'configured') {
                    this.encoder.encode(audioData)
                }
            } catch (e) {
                console.error('holochain-audio: encode failed', e)
            } finally {
                try {
                    audioData.close()
                } catch {}
            }
        }
    }

    private handleEncodedChunk(chunk: AnyEncodedAudioChunk): void {
        const targets = this.getTargets()
        if (targets.length === 0) return
        const buf = new Uint8Array(chunk.byteLength)
        chunk.copyTo(buf)
        const payload: VoiceFramePayload = {
            seq: this.seq++,
            ts: chunk.timestamp,
            type: chunk.type,
            data: bytesToBase64(buf),
        }
        this.sendRaw(HOLOCHAIN_AUDIO_MSG_TYPE, JSON.stringify(payload), targets)
    }

    private sendRaw(msgType: string, payload: string, targets: AgentPubKey[]): void {
        this.send(msgType, payload, targets)
    }

    private openPeer(keyB64: string): PeerState | null {
        const g: any = globalThis as any
        if (!g.AudioDecoder || !g.EncodedAudioChunk) {
            console.error('holochain-audio: WebCodecs decoder not available')
            return null
        }
        if (!this.audioContext) return null
        const state: PeerState = {
            decoder: null,
            nextPlaybackTime: 0,
            lastSeq: 0,
        }
        try {
            state.decoder = new g.AudioDecoder({
                output: (data: AnyAudioData) => this.playAudioData(state, keyB64, data),
                error: (e: any) => console.error(`holochain-audio: decoder error ${keyB64.slice(0, 8)}`, e),
            })
            state.decoder.configure({
                codec: 'opus',
                sampleRate: 48000,
                numberOfChannels: 1,
            })
        } catch (e) {
            console.error('holochain-audio: decoder configure failed', e)
            return null
        }
        this.peers.set(keyB64, state)
        return state
    }

    private playAudioData(state: PeerState, keyB64: string, data: AnyAudioData): void {
        const ctx = this.audioContext
        if (!ctx) {
            try {
                data.close()
            } catch {}
            return
        }
        try {
            const sampleRate: number = data.sampleRate
            const numberOfFrames: number = data.numberOfFrames
            const numberOfChannels: number = data.numberOfChannels
            const buffer = ctx.createBuffer(numberOfChannels, numberOfFrames, sampleRate)
            for (let ch = 0; ch < numberOfChannels; ch++) {
                const channel = new Float32Array(numberOfFrames)
                try {
                    data.copyTo(channel, { planeIndex: ch, format: 'f32-planar' })
                } catch {
                    data.copyTo(channel, { planeIndex: ch })
                }
                buffer.copyToChannel(channel, ch)
                if (ch === 0) {
                    let peak = 0
                    for (let i = 0; i < channel.length; i += 10) {
                        const v = channel[i] < 0 ? -channel[i] : channel[i]
                        if (v > peak) peak = v
                    }
                    this.peerAudioLevels.set(keyB64, peak)
                }
            }
            const source = ctx.createBufferSource()
            source.buffer = buffer
            source.connect(ctx.destination)
            const now = ctx.currentTime
            const jitterSec = JITTER_BUFFER_MS / 1000
            const driftSec = PLAYBACK_RESET_DRIFT_MS / 1000
            if (
                state.nextPlaybackTime < now ||
                state.nextPlaybackTime > now + jitterSec + driftSec
            ) {
                state.nextPlaybackTime = now + jitterSec
            }
            source.start(state.nextPlaybackTime)
            state.nextPlaybackTime += numberOfFrames / sampleRate
        } catch (e) {
            console.error('holochain-audio: playback error', e)
        } finally {
            try {
                data.close()
            } catch {}
        }
    }
}

function bytesToBase64(bytes: Uint8Array): string {
    let s = ''
    const CHUNK = 0x8000
    for (let i = 0; i < bytes.length; i += CHUNK) {
        s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)))
    }
    return btoa(s)
}

function base64ToBytes(b64: string): Uint8Array {
    const s = atob(b64)
    const out = new Uint8Array(s.length)
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i)
    return out
}
