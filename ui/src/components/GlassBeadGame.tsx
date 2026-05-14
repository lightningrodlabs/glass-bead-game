/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useContext, useState, useEffect, useRef } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import Peer from 'simple-peer'
import * as d3 from 'd3'
import { v4 as uuidv4 } from 'uuid'
import {
    encodeHashToBase64,
    decodeHashFromBase64,
    SignalType,
} from '@holochain/client'
import type { AgentPubKey, EntryHash, Signal as HcSignal } from '@holochain/client'
import GlassBeadGameService from '@src/glassbeadgame.service'
import { AppContext } from '@src/contexts'
import styles from '@styles/components/GlassBeadGame.module.scss'
import {
    isPlural,
    timeSinceCreated,
    dateCreated,
    notNull,
    allValid,
    defaultErrorState,
} from '@src/Helpers'
import { GameSettingsData, Signal } from '@src/GameTypes'
import {
    HolochainAudio,
    HOLOCHAIN_AUDIO_MSG_TYPE,
    HOLOCHAIN_AUDIO_ANNOUNCE_TYPE,
    HOLOCHAIN_AUDIO_MUTE_TYPE,
} from '@src/holochain-audio'
import CloseOnClickOutside from '@components/CloseOnClickOutside'
import Modal from '@components/Modal'
import ImageUploadModal from '@components/Modals/ImageUploadModal'
import Input from '@components/Input'
import Button from '@components/Button'
import LoadingWheel from '@components/LoadingWheel'
import SuccessMessage from '@components/SuccessMessage'
import Row from '@components/Row'
import Column from '@components/Column'
import Scrollbars from '@components/Scrollbars'
import Markdown from '@components/Markdown'
import GBGBackgroundModal from '@components/Modals/GBGBackgroundModal'
import BeadCard from '@src/components/Cards/BeadCard'
import HelpModal from '@components/Modals/HelpModal'
import AgentAvatar from '@components/AgentAvatar'
import { ReactComponent as AudioIconSVG } from '@svgs/microphone-solid.svg'
import { ReactComponent as AudioSlashIconSVG } from '@svgs/microphone-slash-solid.svg'
import { ReactComponent as VideoIconSVG } from '@svgs/video-solid.svg'
import { ReactComponent as VideoSlashIconSVG } from '@svgs/video-slash-solid.svg'
import { ReactComponent as ChevronUpIconSVG } from '@svgs/chevron-up-solid.svg'
import { ReactComponent as ChevronDownIconSVG } from '@svgs/chevron-down-solid.svg'
import { ReactComponent as DNAIconSVG } from '@svgs/dna.svg'
import { ReactComponent as LockIconSVG } from '@svgs/lock-solid.svg'
import { ReactComponent as EditIconSVG } from '@svgs/edit-solid.svg'
import { ReactComponent as RefreshIconSVG } from '@svgs/repost.svg'
import { ReactComponent as CurvedDNASVG } from '@svgs/curved-dna.svg'
import { ReactComponent as CommentIconSVG } from '@svgs/comment-solid.svg'
import { ReactComponent as CastaliaIconSVG } from '@svgs/castalia-logo.svg'
import { ReactComponent as HelpIcon } from '@svgs/question-solid.svg'

const eqKey = (a: AgentPubKey | undefined, b: AgentPubKey | undefined): boolean => {
    if (!a || !b) return false
    return encodeHashToBase64(a) === encodeHashToBase64(b)
}

const keyOf = (k: AgentPubKey): string => encodeHashToBase64(k)

const dedupeKeys = (keys: AgentPubKey[]): AgentPubKey[] => {
    const seen = new Set<string>()
    const out: AgentPubKey[] = []
    for (const k of keys) {
        const b = keyOf(k)
        if (seen.has(b)) continue
        seen.add(b)
        out.push(k)
    }
    return out
}

const gameDefaults = {
    id: null,
    topic: null,
    locked: true,
    introDuration: 30,
    numberOfTurns: 3,
    moveDuration: 60,
    intervalDuration: 0,
    outroDuration: 0,
}

const colors = {
    red: '#ef0037',
    orange: '#f59c27',
    yellow: '#daf930',
    green: '#00e697',
    aqua: '#00b1a9',
    blue: '#4f8af7',
    purple: '#a65cda',
    grey1: '#e9e9ea',
    grey2: '#d7d7d9',
    grey3: '#c6c6c7',
}

const Video = (props) => {
    const {
        id,
        agentKey,
        size,
        audioEnabled,
        videoEnabled,
        toggleAudio,
        toggleVideo,
        audioOnly,
        refreshStream,
    } = props
    return (
        <div className={`${styles.videoWrapper} ${size}`}>
            {audioOnly && <AudioIconSVG />}
            <video id={id} muted autoPlay playsInline>
                <track kind='captions' />
            </video>
            <div className={styles.videoUser}>
                <AgentAvatar agentPubKey={agentKey} size={40} />
            </div>
            {id === 'your-video' ? (
                <div className={styles.videoButtons}>
                    <button type='button' onClick={toggleAudio}>
                        {audioEnabled ? <AudioIconSVG /> : <AudioSlashIconSVG />}
                    </button>
                    {!audioOnly && (
                        <button type='button' onClick={toggleVideo}>
                            {videoEnabled ? <VideoIconSVG /> : <VideoSlashIconSVG />}
                        </button>
                    )}
                </div>
            ) : (
                <div className={styles.videoButtons}>
                    <button type='button' onClick={() => refreshStream(agentKey)}>
                        <RefreshIconSVG />
                    </button>
                </div>
            )}
        </div>
    )
}

const Comment = (props: {
    comment: { agentKey?: AgentPubKey; text: string; timestamp?: string }
    myAgentPubKey: AgentPubKey | undefined
}) => {
    const { comment, myAgentPubKey } = props
    const { agentKey, text, timestamp } = comment
    const ctx = useContext(AppContext)
    const [nickname, setNickname] = useState<string>('')

    useEffect(() => {
        if (!ctx || !agentKey) return
        ctx.profilesStore.client.getAgentProfile(agentKey).then((p) => {
            if (p) setNickname(p.entry.nickname)
        })
    }, [ctx, agentKey ? keyOf(agentKey) : ''])

    if (!agentKey) {
        return (
            <Row className={styles.adminComment}>
                <p>{text}</p>
            </Row>
        )
    }
    return (
        <Row className={styles.userComment}>
            <AgentAvatar agentPubKey={agentKey} size={40} />
            <Column className={styles.textWrapper}>
                <Row className={styles.header}>
                    <h1>{eqKey(agentKey, myAgentPubKey) ? 'You' : nickname}</h1>
                    {timestamp && (
                        <p title={dateCreated(timestamp)}>{timeSinceCreated(timestamp)}</p>
                    )}
                </Row>
                <Markdown text={text} />
            </Column>
        </Row>
    )
}

const PlayerRow = (props: {
    agentKey: AgentPubKey
    myAgentPubKey: AgentPubKey | undefined
    fontSize: number
    imageSize: number
    style?: React.CSSProperties
}) => {
    const { agentKey, myAgentPubKey, fontSize, imageSize, style } = props
    const ctx = useContext(AppContext)
    const [nickname, setNickname] = useState<string>('')
    useEffect(() => {
        if (!ctx) return
        ctx.profilesStore.client.getAgentProfile(agentKey).then((p) => {
            if (p) setNickname(p.entry.nickname)
        })
    }, [ctx, keyOf(agentKey)])

    return (
        <Row centerY style={style}>
            <AgentAvatar agentPubKey={agentKey} size={imageSize} style={{ marginRight: 10 }} />
            <p style={{ fontSize }}>{eqKey(agentKey, myAgentPubKey) ? 'You' : nickname}</p>
        </Row>
    )
}

const GameSettingsModal = (props: {
    close: () => void
    gameData: any
    myAgentPubKey: AgentPubKey
    players: AgentPubKey[]
    setPlayers: (players: AgentPubKey[]) => void
    signalStartGame: (data: any) => void
}) => {
    const { close, gameData, myAgentPubKey, players, setPlayers, signalStartGame } = props

    const [formData, setFormData] = useState({
        introDuration: {
            value: notNull(gameData.introDuration) || gameDefaults.introDuration,
            validate: (v) => (v < 10 || v > 300 ? ['Must be between 10 seconds and 5 mins'] : []),
            ...defaultErrorState,
        },
        numberOfTurns: {
            value: notNull(gameData.numberOfTurns) || gameDefaults.numberOfTurns,
            validate: (v) => (v < 1 || v > 20 ? ['Must be between 1 and 20 turns'] : []),
            ...defaultErrorState,
        },
        moveDuration: {
            value: notNull(gameData.moveDuration) || gameDefaults.moveDuration,
            validate: (v) => (v < 10 || v > 600 ? ['Must be between 10 seconds and 10 mins'] : []),
            ...defaultErrorState,
        },
        intervalDuration: {
            value: notNull(gameData.intervalDuration) || gameDefaults.intervalDuration,
            validate: (v) => (v > 60 ? ['Must be 60 seconds or less'] : []),
            ...defaultErrorState,
        },
        outroDuration: {
            value: notNull(gameData.outroDuration) || gameDefaults.outroDuration,
            validate: (v) => (v > 300 ? ['Must be 5 minutes or less'] : []),
            ...defaultErrorState,
        },
    })
    const { introDuration, numberOfTurns, moveDuration, intervalDuration, outroDuration } = formData
    const [playersError, setPlayersError] = useState('')
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)

    function updateValue(name, value) {
        setFormData({ ...formData, [name]: { ...formData[name], value, state: 'default' } })
    }

    function updatePlayerPosition(from, to) {
        const newPlayers = [...players]
        const p = newPlayers[from]
        newPlayers.splice(from, 1)
        newPlayers.splice(to, 0, p)
        setPlayers(newPlayers)
    }

    function saveSettings(e) {
        e.preventDefault()
        setPlayersError(players.length ? '' : 'At least one player must be live')
        if (allValid(formData, setFormData) && players.length) {
            signalStartGame({
                ...gameData,
                numberOfTurns: numberOfTurns.value,
                moveDuration: moveDuration.value,
                introDuration: introDuration.value,
                intervalDuration: intervalDuration.value,
                outroDuration: outroDuration.value,
                players,
            })
            close()
        }
    }

    return (
        <Modal close={close} centered>
            <h1>Game settings</h1>
            <form onSubmit={saveSettings}>
                <div className={styles.settingSections}>
                    <Column style={{ width: 420, marginRight: 80, marginBottom: 20 }}>
                        {[
                            {
                                name: 'introDuration',
                                label: 'Intro duration (seconds)',
                                field: introDuration,
                                description:
                                    'A moment of introspection, silence or meditation before the game.',
                            },
                            {
                                name: 'numberOfTurns',
                                label: 'Number of turns',
                                field: numberOfTurns,
                                description: 'Total moves = turns × players.',
                            },
                            {
                                name: 'moveDuration',
                                label: 'Move duration (seconds)',
                                field: moveDuration,
                                description: 'The length of each move.',
                            },
                            {
                                name: 'intervalDuration',
                                label: 'Interval duration (seconds)',
                                field: intervalDuration,
                                description:
                                    'Pause between moves for players to reflect or prepare notes.',
                            },
                            {
                                name: 'outroDuration',
                                label: 'Outro duration (seconds)',
                                field: outroDuration,
                                description:
                                    'A moment of reflection, silence or meditation after the game.',
                            },
                        ].map(({ name, label, field, description }) => (
                            <Row key={name} className={styles.setting}>
                                <Input
                                    type='text'
                                    style={{ width: 100, flexShrink: 0 }}
                                    disabled={loading || saved}
                                    state={field.state}
                                    errors={field.errors}
                                    value={field.value}
                                    onChange={(v) => updateValue(name, +v.replace(/\D/g, ''))}
                                />
                                <Column className={styles.settingText}>
                                    <h3>{label}</h3>
                                    <p>{description}</p>
                                </Column>
                            </Row>
                        ))}
                    </Column>
                    <Column style={{ marginBottom: 20, minWidth: 200 }}>
                        <h2 style={{ margin: 0, lineHeight: '20px' }}>Player order</h2>
                        {players.map((p, i) => (
                            <Row style={{ marginTop: 10 }} key={keyOf(p)}>
                                <div className={styles.position}>{i + 1}</div>
                                <div className={styles.positionControls}>
                                    {i > 0 && (
                                        <button
                                            type='button'
                                            onClick={() => updatePlayerPosition(i, i - 1)}
                                        >
                                            <ChevronUpIconSVG />
                                        </button>
                                    )}
                                    {i < players.length - 1 && (
                                        <button
                                            type='button'
                                            onClick={() => updatePlayerPosition(i, i + 1)}
                                        >
                                            <ChevronDownIconSVG />
                                        </button>
                                    )}
                                </div>
                                <PlayerRow
                                    agentKey={p}
                                    myAgentPubKey={myAgentPubKey}
                                    fontSize={16}
                                    imageSize={35}
                                />
                            </Row>
                        ))}
                        {!players.length && <p className={styles.grey}>No users live...</p>}
                        {!!playersError.length && <p className={styles.red}>{playersError}</p>}
                    </Column>
                </div>
                <Row>
                    {!saved && (
                        <Button text='Start game' color='blue' disabled={loading || saved} submit />
                    )}
                    {loading && <LoadingWheel />}
                    {saved && <SuccessMessage text='Saved' />}
                </Row>
            </form>
        </Modal>
    )
}

type ConnectionMode = 'webrtc' | 'holochain' | null

const ConnectControl = (props: {
    mode: ConnectionMode
    loading: boolean
    menuOpen: boolean
    onMenuToggle: () => void
    onMenuClose: () => void
    onPickWebRTC: () => void
    onPickHolochain: () => void
    onDisconnect: () => void
}): JSX.Element => {
    const { mode, loading, menuOpen, onMenuToggle, onMenuClose, onPickWebRTC, onPickHolochain, onDisconnect } = props
    if (mode !== null) {
        return (
            <Button
                text='Go offline'
                color='red'
                style={{ marginBottom: 10, alignSelf: 'flex-start' }}
                loading={loading}
                disabled={loading}
                onClick={onDisconnect}
            />
        )
    }
    return (
        <div style={{ position: 'relative', marginBottom: 10, alignSelf: 'flex-start' }}>
            <Button
                text='Go live ▾'
                color='aqua'
                loading={loading}
                disabled={loading}
                onClick={onMenuToggle}
            />
            {menuOpen && (
                <CloseOnClickOutside onClick={onMenuClose}>
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: 4,
                            background: 'white',
                            border: '1px solid #ddd',
                            borderRadius: 6,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            zIndex: 50,
                            minWidth: 200,
                        }}
                    >
                        <button
                            type='button'
                            onClick={onPickHolochain}
                            style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 12px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Audio (holochain)
                        </button>
                        <button
                            type='button'
                            onClick={onPickWebRTC}
                            style={{
                                display: 'block',
                                width: '100%',
                                textAlign: 'left',
                                padding: '8px 12px',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Video & Audio (webrtc)
                        </button>
                    </div>
                </CloseOnClickOutside>
            )}
        </div>
    )
}

// 5-brick stacked vertical level meter, ported from presence's audio-level-meter.
// Sqrt scaling gives perceptually-linear response. Bottom 3 green, 4th amber, 5th red.
const LEVEL_METER_COLORS = ['#7adc7a', '#7adc7a', '#7adc7a', '#e7a008', '#c72100']
const LevelMeter = (props: { level: number }): JSX.Element => {
    const bricks = Math.min(5, Math.round(Math.sqrt(Math.max(0, props.level)) * 5))
    return (
        <div
            style={{
                display: 'inline-flex',
                flexDirection: 'column-reverse',
                gap: 1,
                height: 20,
                verticalAlign: 'middle',
            }}
        >
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    style={{
                        width: 6,
                        height: 3,
                        borderRadius: 1,
                        background:
                            i < bricks ? LEVEL_METER_COLORS[i] : 'rgba(0,0,0,0.15)',
                    }}
                />
            ))}
        </div>
    )
}

const LiveRoomPlayerRow = (props: {
    agentKey: AgentPubKey
    myAgentPubKey: AgentPubKey | undefined
    isLive: boolean
    isMe: boolean
    muted: boolean
    level: number
    onToggleMute?: () => void
}): JSX.Element => {
    const { agentKey, myAgentPubKey, isLive, isMe, muted, level, onToggleMute } = props
    const showMuted = muted
    return (
        <Row centerY style={{ marginBottom: 10, gap: 8 }}>
            <PlayerRow
                agentKey={agentKey}
                myAgentPubKey={myAgentPubKey}
                fontSize={16}
                imageSize={40}
            />
            {isLive && (
                <>
                    <button
                        type='button'
                        onClick={onToggleMute}
                        disabled={!onToggleMute}
                        title={isMe ? (showMuted ? 'Unmute' : 'Mute') : undefined}
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            border: 'none',
                            background: showMuted ? '#e74c3c' : '#2ecc71',
                            cursor: onToggleMute ? 'pointer' : 'default',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {showMuted ? (
                            <AudioSlashIconSVG style={{ width: 12, height: 12, fill: 'white' }} />
                        ) : (
                            <AudioIconSVG style={{ width: 12, height: 12, fill: 'white' }} />
                        )}
                    </button>
                    <LevelMeter level={level} />
                </>
            )}
        </Row>
    )
}

const GlassBeadGame = (): JSX.Element => {
    const ctx = useContext(AppContext)
    const history = useHistory()
    const location = useLocation()
    const entryHashB64 = decodeURIComponent(location.pathname.split('/')[2] || '')
    const entryHash: EntryHash = decodeHashFromBase64(entryHashB64)
    const loggedIn = true
    const postId = entryHashB64

    const serviceRef = useRef<GlassBeadGameService | null>(null)
    const myAgentPubKeyRef = useRef<AgentPubKey | undefined>(undefined)
    const joinGameHash = useRef<any>()
    const peopleInRoomRef = useRef<AgentPubKey[]>([])

    const [gameData, setGameData] = useState<any>(gameDefaults)
    const [gameInProgress, setGameInProgress] = useState(false)
    const [userIsStreaming, setUserIsStreaming] = useState(false)
    const [peopleInRoom, setPeopleInRoom] = useState<AgentPubKey[]>([])
    const [players, setPlayers] = useState<AgentPubKey[]>([])
    const [gameSettingsModalOpen, setGameSettingsModalOpen] = useState(false)
    const [beads, setBeads] = useState<any[]>([])
    const [comments, setComments] = useState<any[]>([])
    const [showComments, setShowComments] = useState(false)
    const [showVideos, setShowVideos] = useState(false)
    const [firstInteractionWithPage, setFirstInteractionWithPage] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [newTopic, setNewTopic] = useState('')
    const [audioTrackEnabled, setAudioTrackEnabled] = useState(true)
    const [videoTrackEnabled, setVideoTrackEnabled] = useState(true)
    const [audioOnly, setAudioOnly] = useState(false)
    const [turn, setTurn] = useState(0)
    const [loadingStream, setLoadingStream] = useState(false)
    const [connectionMode, setConnectionMode] = useState<'webrtc' | 'holochain' | null>(null)
    const [connectMenuOpen, setConnectMenuOpen] = useState(false)
    const [holochainMuted, setHolochainMuted] = useState(false)
    const [activePlayer, setActivePlayer] = useState<AgentPubKey | null>(null)
    // Forces a re-render at meter-update cadence while holochain audio is active.
    const [, setLevelTick] = useState(0)
    const [backgroundModalOpen, setBackgroundModalOpen] = useState(false)
    const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)
    const [topicImageModalOpen, setTopicImageModalOpen] = useState(false)
    const [topicTextModalOpen, setTopicTextModalOpen] = useState(false)
    const [leaveRoomModalOpen, setLeaveRoomModalOpen] = useState(false)
    const [mobileTab, setMobileTab] = useState<'comments' | 'game' | 'videos'>('game')
    const [alertMessage, setAlertMessage] = useState('')
    const [alertModalOpen, setAlertModalOpen] = useState(false)
    const [helpModalOpen, setHelpModalOpen] = useState(false)

    const initialisedRef = useRef(false)
    const peersRef = useRef<Array<{ agentKey: AgentPubKey; peer: any }>>([])
    const videosRef = useRef<
        Array<{ agentKey: AgentPubKey; peer: any; audioOnly: boolean }>
    >([])
    const secondsTimerRef = useRef<any>(null)
    const mediaRecorderRef = useRef<any>(null)
    const chunksRef = useRef<any[]>([])
    const streamRef = useRef<any>(null)
    const holochainAudioRef = useRef<HolochainAudio | null>(null)
    const levelTickIntervalRef = useRef<any>(null)
    const activePlayerRef = useRef<AgentPubKey | null>(null)
    // Agents currently broadcasting Holochain audio in this room, by keyB64.
    // Tracked independently of holochainAudioRef so peers who haven't gone live
    // can still see who has.
    const livePeersRef = useRef<Set<string>>(new Set())
    // Peer mute state, by base64 agent key. Updated from announce + mute signals.
    const peerMutedRef = useRef<Map<string, boolean>>(new Map())
    const [, setLivePeersTick] = useState(0)
    const bumpLivePeers = () => setLivePeersTick((t) => (t + 1) & 0xffff)
    const audioRef = useRef<any>(null)
    const videoRef = useRef<any>(null)
    const showVideoRef = useRef(showVideos)
    const liveBeadIndexRef = useRef(1)

    const largeScreen = document.body.clientWidth >= 900
    const roomIntro = new Audio('/audio/room-intro.mp3')
    const highMetalTone = new Audio('/audio/hi-metal-tone.mp3')
    const lowMetalTone = new Audio('/audio/lo-metal-tone.mp3')
    const arcWidth = 20
    const gameArcRadius = 210
    const turnArcRadius = 180
    const moveArcRadius = 150
    const arcs = {
        gameArc: d3
            .arc()
            .innerRadius(gameArcRadius - arcWidth)
            .outerRadius(gameArcRadius)
            .cornerRadius(5),
        turnArc: d3
            .arc()
            .innerRadius(turnArcRadius - arcWidth)
            .outerRadius(turnArcRadius)
            .cornerRadius(5),
        moveArc: d3
            .arc()
            .innerRadius(moveArcRadius - arcWidth)
            .outerRadius(moveArcRadius)
            .cornerRadius(5),
    }
    const iceConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
        ],
    }
    const totalUsersStreaming = videosRef.current.length + (userIsStreaming ? 1 : 0)

    function updateShowVideos(value: boolean) {
        setShowVideos(value)
        showVideoRef.current = value
    }

    function alert(message) {
        setAlertMessage(message)
        setAlertModalOpen(true)
        return false
    }

    function allowedTo(type) {
        switch (type) {
            case 'start-game':
                return loggedIn || alert('Log in to start the game')
            case 'save-game':
                return loggedIn || alert('Log in to save the game')
            case 'stream':
                return loggedIn || alert('Log in to start streaming')
            case 'comment':
                if (gameData.locked) return alert('Game locked')
                if (!loggedIn) return alert('Log in to add comments')
                return true
            case 'change-background':
                if (gameData.locked) return alert('Game locked')
                if (!loggedIn) return alert('Log in to change the background')
                return true
            case 'change-topic-text':
                if (gameData.locked) return alert('Game locked')
                if (!loggedIn) return alert('Log in to change the topic')
                return true
            case 'change-topic-image':
                if (gameData.locked) return alert('Game locked')
                if (!loggedIn) return alert('Log in to change the topic image')
                return true
            default:
                return false
        }
    }

    async function nicknameFor(agentKey: AgentPubKey): Promise<string> {
        if (!ctx) return ''
        const profile = await ctx.profilesStore.client.getAgentProfile(agentKey)
        return profile?.entry.nickname ?? 'Someone'
    }

    function pushComment(text: string) {
        setComments((c) => [
            ...c,
            { id: uuidv4(), text, timestamp: new Date().toISOString() },
        ])
    }

    function pushUserComment(agentKey: AgentPubKey, text: string) {
        setComments((c) => [
            ...c,
            { id: uuidv4(), agentKey, text, timestamp: new Date().toISOString() },
        ])
    }

    function disconnectWebRTC() {
        if (!serviceRef.current || !myAgentPubKeyRef.current) return
        if (videoRef.current) {
            videoRef.current.pause()
            videoRef.current.srcObject = null
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
        }
        streamRef.current = null
        videoRef.current = null
        setUserIsStreaming(false)
        setAudioTrackEnabled(true)
        setVideoTrackEnabled(true)
        const signal: Signal = {
            gameHash: entryHash,
            message: {
                type: 'StreamDisconnected',
                content: { agentKey: myAgentPubKeyRef.current },
            },
        }
        serviceRef.current
            .notify(signal, peopleInRoom)
            .catch((error) => console.log('notify error: ', error))
        if (!videosRef.current.length) {
            updateShowVideos(false)
            updateMobileTab('game')
        }
    }

    function connectWebRTC() {
        if (!serviceRef.current || !myAgentPubKeyRef.current) return
        setLoadingStream(true)
        navigator.mediaDevices
            .getUserMedia({ video: { width: 427, height: 240 }, audio: true })
            .then((stream) => {
                streamRef.current = stream
                peersRef.current.forEach((p) => p.peer.addStream(stream))
                setAudioOnly(false)
                setUserIsStreaming(true)
                setConnectionMode('webrtc')
                setPlayers((prev) => [...prev, myAgentPubKeyRef.current as AgentPubKey])
                setLoadingStream(false)
                openVideoWall()
            })
            .catch(() => {
                console.log('Unable to connect video, trying audio only...')
                navigator.mediaDevices
                    .getUserMedia({ audio: true })
                    .then((stream) => {
                        streamRef.current = stream
                        stream.getTracks().forEach((track) => (track.enabled = false))
                        peersRef.current.forEach((p) => p.peer.addStream(stream))
                        setAudioOnly(true)
                        setUserIsStreaming(true)
                        setConnectionMode('webrtc')
                        setPlayers((prev) => [...prev, myAgentPubKeyRef.current as AgentPubKey])
                        setLoadingStream(false)
                        openVideoWall()
                    })
                    .catch(() => {
                        setAlertMessage('Unable to connect media devices')
                        setAlertModalOpen(true)
                        setLoadingStream(false)
                    })
            })
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((audio) => (audioRef.current = audio))
    }

    async function connectHolochain() {
        if (!serviceRef.current || !myAgentPubKeyRef.current) return
        if (holochainAudioRef.current) return
        setLoadingStream(true)
        const audio = new HolochainAudio({
            send: (msgType, payload, targets) => {
                const svc = serviceRef.current
                const me = myAgentPubKeyRef.current
                if (!svc || !me) return
                const sig: Signal = {
                    gameHash: entryHash,
                    message: {
                        type: 'ModuleData',
                        content: { fromAgent: me, msgType, payload },
                    },
                }
                svc.notify(sig, targets).catch((error) =>
                    console.log('holochain audio notify error: ', error)
                )
            },
            getTargets: () => {
                const me = myAgentPubKeyRef.current
                if (!me) return []
                return peopleInRoomRef.current.filter((p) => !eqKey(p, me))
            },
        })
        const ok = await audio.start()
        if (!ok) {
            setAlertMessage('Unable to start Holochain audio')
            setAlertModalOpen(true)
            setLoadingStream(false)
            return
        }
        holochainAudioRef.current = audio
        setConnectionMode('holochain')
        setHolochainMuted(false)
        setLoadingStream(false)
        // Bead recording (per-turn audio capture for createBead) uses a separate
        // MediaStream via MediaRecorder. The WebRTC path acquires this too;
        // mirror it here so startAudioRecording doesn't crash on null.
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((s) => (audioRef.current = s))
            .catch(() => {})
        // Announce ourselves so existing peers see us before any voice frame arrives.
        const me = myAgentPubKeyRef.current
        const others = peopleInRoomRef.current.filter((p) => !eqKey(p, me))
        audio.announce('join', others)
        if (me) {
            setPlayers((prev) => (prev.some((p) => eqKey(p, me)) ? prev : [...prev, me]))
        }
        levelTickIntervalRef.current = setInterval(() => {
            setLevelTick((t) => (t + 1) & 0xffff)
        }, 80)
    }

    function disconnectHolochain() {
        if (levelTickIntervalRef.current) {
            clearInterval(levelTickIntervalRef.current)
            levelTickIntervalRef.current = null
        }
        const audio = holochainAudioRef.current
        if (audio) {
            const me = myAgentPubKeyRef.current
            const others = me
                ? peopleInRoomRef.current.filter((p) => !eqKey(p, me))
                : []
            audio.announce('leave', others)
            holochainAudioRef.current = null
            audio.stop().catch((e) => console.log('holochain audio stop error: ', e))
            if (me) setPlayers((prev) => prev.filter((p) => !eqKey(p, me)))
        }
        if (audioRef.current) {
            audioRef.current.getTracks?.().forEach((t: MediaStreamTrack) => t.stop())
            audioRef.current = null
        }
        setHolochainMuted(false)
    }

    function disconnect() {
        if (connectionMode === 'webrtc') disconnectWebRTC()
        else if (connectionMode === 'holochain') disconnectHolochain()
        setConnectionMode(null)
    }

    function toggleHolochainMute() {
        const audio = holochainAudioRef.current
        if (!audio) return
        const next = !holochainMuted
        audio.setMuted(next)
        setHolochainMuted(next)
        const me = myAgentPubKeyRef.current
        if (me) {
            const others = peopleInRoomRef.current.filter((p) => !eqKey(p, me))
            audio.broadcastMute(others)
        }
    }

    useEffect(() => {
        if (!userIsStreaming || !streamRef.current) return undefined
        const el = document.getElementById('your-video') as HTMLVideoElement | null
        if (!el) return undefined
        videoRef.current = el
        el.srcObject = streamRef.current
        return () => {
            videoRef.current = null
        }
    }, [userIsStreaming])

    function refreshStream(agentKey: AgentPubKey) {
        if (!serviceRef.current || !myAgentPubKeyRef.current) return
        const sig: Signal = {
            gameHash: entryHash,
            message: {
                type: 'RefreshRequest',
                content: { agentKey: myAgentPubKeyRef.current },
            },
        }
        serviceRef.current
            .notify(sig, [agentKey])
            .catch((error) => console.log('notify error: ', error))
        const peerObject = peersRef.current.find((p) => eqKey(p.agentKey, agentKey))
        if (peerObject) {
            peerObject.peer.destroy()
            peersRef.current = peersRef.current.filter((p) => !eqKey(p.agentKey, agentKey))
            videosRef.current = videosRef.current.filter((v) => !eqKey(v.agentKey, agentKey))
            setPlayers((ps) => ps.filter((p) => !eqKey(p, agentKey)))
        }
        const peer = new Peer({
            initiator: true,
            config: iceConfig,
            stream: streamRef.current,
        })
        peer.on('signal', (data) => {
            const signal: Signal = {
                gameHash: entryHash,
                message: {
                    type: 'NewSignalRequest',
                    content: {
                        agentKey: myAgentPubKeyRef.current as AgentPubKey,
                        signal: JSON.stringify(data),
                    },
                },
            }
            serviceRef.current!
                .notify(signal, [agentKey])
                .catch((error) => console.log('notify error: ', error))
        })
        peer.on('stream', (stream) => {
            videosRef.current.push({
                agentKey,
                peer,
                audioOnly: !stream.getVideoTracks().length,
            })
            nicknameFor(agentKey).then((name) => pushComment(`${name}'s video connected`))
            addStreamToVideo(keyOf(agentKey), stream)
            setPlayers((prev) => [...prev, agentKey])
        })
        peer.on('close', () => peer.destroy())
        peer.on('error', (error) => console.log('error 2: ', error))
        peersRef.current.push({ agentKey, peer })
    }

    function toggleAudioTrack() {
        const audioTrack = streamRef.current?.getTracks()[0]
        if (!audioTrack) return
        audioTrack.enabled = !audioTrackEnabled
        setAudioTrackEnabled(!audioTrackEnabled)
    }

    function toggleVideoTrack() {
        const videoTrack = streamRef.current?.getTracks()[1]
        if (!videoTrack) return
        videoTrack.enabled = !videoTrackEnabled
        setVideoTrackEnabled(!videoTrackEnabled)
    }

    function findVideoSize() {
        let videoSize = styles.xl
        if (totalUsersStreaming > 2) videoSize = styles.lg
        if (totalUsersStreaming > 3) videoSize = styles.md
        if (totalUsersStreaming > 4) videoSize = styles.sm
        if (document.body.clientWidth < 600) videoSize = styles.mobile
        return videoSize
    }

    function createComment(e) {
        e.preventDefault()
        if (!serviceRef.current || !myAgentPubKeyRef.current) return
        if (allowedTo('comment') && newComment.length) {
            const text = newComment
            serviceRef.current.createComment({ entryHash, text }).then(() => {
                const signal: Signal = {
                    gameHash: entryHash,
                    message: {
                        type: 'NewComment',
                        content: {
                            agentKey: myAgentPubKeyRef.current as AgentPubKey,
                            text,
                        },
                    },
                }
                serviceRef.current!
                    .notify(signal, peopleInRoom)
                    .then(() => setNewComment(''))
                    .catch((error) => console.log('notify error: ', error))
            })
        }
    }

    function startArc(
        type: 'game' | 'turn' | 'move',
        duration: number,
        color: string,
        reverse?: boolean
    ) {
        d3.select(`#${type}-arc`).remove()
        d3.select('#timer-arcs')
            .append('path')
            .datum({ startAngle: 0, endAngle: reverse ? -2 * Math.PI : 2 * Math.PI })
            .attr('id', `${type}-arc`)
            .style('fill', color)
            .style('opacity', 0.8)
            .attr('d', arcs[`${type}Arc`])
            .transition()
            .ease(d3.easeLinear)
            .duration(duration * 1000)
            .attrTween('d', (d) => {
                const interpolate = d3.interpolate(d.endAngle, 0)
                return (t) => {
                    d.endAngle = interpolate(t)
                    return arcs[`${type}Arc`](d)
                }
            })
    }

    function startAudioRecording(moveNumber: number) {
        if (!serviceRef.current || !myAgentPubKeyRef.current) return
        mediaRecorderRef.current = new MediaRecorder(audioRef.current)
        mediaRecorderRef.current.ondataavailable = (e) => {
            chunksRef.current.push(e.data)
        }
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/mpeg-3' })
            chunksRef.current = []
            const reader = new FileReader()
            reader.addEventListener('loadend', async (e) => {
                const array = e!.target!.result as ArrayBufferLike
                const uint8Array = new Uint8Array(array)
                const bead = {
                    audio: uint8Array,
                    index: moveNumber,
                }
                const signal: Signal = {
                    gameHash: entryHash,
                    message: {
                        type: 'NewBead',
                        content: {
                            agentKey: myAgentPubKeyRef.current as AgentPubKey,
                            audio: uint8Array,
                            index: moveNumber,
                        },
                    },
                }
                serviceRef.current!.createBead({ entryHash, bead }).then(() => {
                    serviceRef.current!
                        .notify(signal, peopleInRoomRef.current)
                        .catch((error) => console.log(error))
                })
            })
            reader.readAsArrayBuffer(blob)
        }
        mediaRecorderRef.current.start()
    }

    function signalStartGame(data) {
        if (!serviceRef.current || !myAgentPubKeyRef.current) return
        const dedupedPlayers = dedupeKeys(data.players as AgentPubKey[])
        const wirePayload = {
            ...data,
            players: dedupedPlayers.map((p) => keyOf(p)),
        }
        // Use the deduped list locally too, so initiator's UI matches the wire.
        data = { ...data, players: dedupedPlayers }
        const signal: Signal = {
            gameHash: entryHash,
            message: {
                type: 'StartGame',
                content: {
                    agentKey: myAgentPubKeyRef.current,
                    data: JSON.stringify(wirePayload),
                },
            },
        }
        const me = myAgentPubKeyRef.current
        const recipients = peopleInRoomRef.current.filter((p) => !eqKey(p, me))
        serviceRef.current
            .notify(signal, recipients)
            .catch((error) => console.log(error))
        // Drive the initiator's UI locally — send_remote_signal doesn't deliver to self
        // and even if it did, relying on the round-trip lets the rings start late.
        startGame(data)
        setGameSettingsModalOpen(false)
        setGameData(data)
        setGameInProgress(true)
        setBeads([])
        d3.select('#play-button')
            .classed('transitioning', true)
            .transition()
            .duration(1000)
            .style('opacity', 0)
            .remove()
        d3.select('#pause-button')
            .classed('transitioning', true)
            .transition()
            .duration(1000)
            .style('opacity', 0)
            .remove()
        liveBeadIndexRef.current = 1
    }

    function startGame(data) {
        setGameData(data)
        setPlayers(dedupeKeys(data.players ?? []))
        setShowComments(false)
        updateShowVideos(false)
        d3.select('#timer-move-state').text('Intro')
        d3.select('#timer-seconds').text(data.introDuration)
        const firstPlayer: AgentPubKey = data.players[0]
        d3.select(`#player-${keyOf(firstPlayer)}`).text('(up next)')
        startArc('move', data.introDuration, colors.yellow)
        let timeLeft = data.introDuration
        secondsTimerRef.current = setInterval(() => {
            timeLeft -= 1
            d3.select('#timer-seconds').text(timeLeft)
            if (timeLeft < 1) {
                clearInterval(secondsTimerRef.current)
                startMove(1, 0, firstPlayer, data)
            }
        }, 1000)
    }

    function startMove(moveNumber, turnNumber, player: AgentPubKey, data) {
        const { numberOfTurns, moveDuration, intervalDuration } = data
        activePlayerRef.current = player
        setActivePlayer(player)
        if (eqKey(player, myAgentPubKeyRef.current)) startAudioRecording(moveNumber)
        const turnDuration = data.players.length * (moveDuration + intervalDuration)
        const gameDuration = turnDuration * numberOfTurns - intervalDuration
        if (moveNumber === 1) startArc('game', gameDuration, colors.blue)
        const newTurnNumber = Math.ceil(moveNumber / data.players.length)
        if (turnNumber !== newTurnNumber) {
            setTurn(newTurnNumber)
            startArc(
                'turn',
                newTurnNumber === numberOfTurns ? turnDuration - intervalDuration : turnDuration,
                colors.aqua
            )
        }
        startArc('move', moveDuration, colors.green)
        lowMetalTone.play()
        d3.select('#timer-move-state').text('Move')
        d3.select('#timer-seconds').text(moveDuration)
        d3.selectAll(`.${styles.playerState}`).text('')
        d3.select(`#player-${keyOf(player)}`).text('(recording)')
        let timeLeft = moveDuration
        secondsTimerRef.current = setInterval(() => {
            timeLeft -= 1
            d3.select('#timer-seconds').text(timeLeft)
            if (timeLeft < 1) {
                clearInterval(secondsTimerRef.current)
                if (eqKey(player, myAgentPubKeyRef.current) && mediaRecorderRef.current)
                    mediaRecorderRef.current.stop()
                if (moveNumber < numberOfTurns * data.players.length) {
                    const PPIndex = data.players.findIndex((p: AgentPubKey) => eqKey(p, player))
                    const endOfTurn = PPIndex + 1 === data.players.length
                    const nextPlayer: AgentPubKey = data.players[endOfTurn ? 0 : PPIndex + 1]
                    if (intervalDuration > 0)
                        startInterval(moveNumber + 1, newTurnNumber, nextPlayer, data)
                    else startMove(moveNumber + 1, newTurnNumber, nextPlayer, data)
                } else if (data.outroDuration) startOutro(data)
                else endGame()
            }
        }, 1000)
    }

    function startInterval(moveNumber, turnNumber, nextPlayer: AgentPubKey, data) {
        const { intervalDuration } = data
        startArc('move', intervalDuration, colors.yellow)
        lowMetalTone.play()
        d3.select('#timer-move-state').text('Interval')
        d3.select('#timer-seconds').text(intervalDuration)
        d3.selectAll(`.${styles.playerState}`).text('')
        d3.select(`#player-${keyOf(nextPlayer)}`).text('(up next)')
        let timeLeft = intervalDuration
        secondsTimerRef.current = setInterval(() => {
            timeLeft -= 1
            d3.select('#timer-seconds').text(timeLeft)
            if (timeLeft === 0) {
                clearInterval(secondsTimerRef.current)
                startMove(moveNumber, turnNumber, nextPlayer, data)
            }
        }, 1000)
    }

    function startOutro(data) {
        d3.select('#timer-move-state').text('Outro')
        d3.select('#timer-seconds').text(data.outroDuration)
        d3.selectAll(`.${styles.playerState}`).text('')
        startArc('move', data.outroDuration, colors.yellow, true)
        let timeLeft = data.outroDuration
        secondsTimerRef.current = setInterval(() => {
            timeLeft -= 1
            d3.select('#timer-seconds').text(timeLeft)
            if (timeLeft < 1) {
                clearInterval(secondsTimerRef.current)
                endGame()
            }
        }, 1000)
    }

    function endGame() {
        highMetalTone.play()
        setGameInProgress(false)
        setTurn(0)
        activePlayerRef.current = null
        setActivePlayer(null)
        d3.select('#timer-seconds').text('')
        d3.select('#timer-move-state').text('Move')
        d3.select(`#game-arc`).remove()
        d3.select(`#turn-arc`).remove()
        d3.select(`#move-arc`).remove()
        d3.selectAll(`.${styles.playerState}`).text('')
        pushComment('The game ended')
        addPlayButtonToCenterBead()
        if (largeScreen) {
            setShowComments(true)
            updateShowVideos(true)
        }
    }

    function signalStopGame() {
        if (!serviceRef.current || !myAgentPubKeyRef.current) return
        const signal: Signal = {
            gameHash: entryHash,
            message: {
                type: 'StopGame',
                content: { agentKey: myAgentPubKeyRef.current },
            },
        }
        serviceRef.current
            .notify(signal, peopleInRoom)
            .catch((error) => console.log(error))
    }

    function peopleInRoomText() {
        const totalUsers = peopleInRoom.length
        return `${totalUsers} ${isPlural(totalUsers) ? 'people' : 'person'} in room`
    }

    function peopleStreamingText() {
        const holochainPeers = livePeersRef.current.size
        const meHolochain = connectionMode === 'holochain' ? 1 : 0
        const webrtcTotal = videosRef.current.length + (userIsStreaming ? 1 : 0)
        const total = webrtcTotal + holochainPeers + meHolochain
        return `${total} ${isPlural(total) ? 'people' : 'person'} live`
    }

    function addStreamToVideo(elementId: string, stream) {
        const video = document.getElementById(elementId) as HTMLVideoElement
        if (video) {
            video.srcObject = stream
            if (showVideoRef.current) {
                video.muted = false
                video.play()
            }
        }
    }

    function openVideoWall() {
        if (firstInteractionWithPage) {
            videosRef.current.forEach((v) => {
                const video = document.getElementById(keyOf(v.agentKey)) as HTMLVideoElement
                if (video) {
                    video.muted = false
                    video.play()
                }
            })
            setFirstInteractionWithPage(false)
        }
        updateShowVideos(true)
    }

    function signalNewTopicImage(url) {
        if (!serviceRef.current || !myAgentPubKeyRef.current) return
        const newSettings = { ...gameData, topicImageUrl: url, topicGroup: '' }
        serviceRef.current.updateGame({ entryHash, newSettings }).then(() => {
            const signal: Signal = {
                gameHash: entryHash,
                message: {
                    type: 'NewTopicImage',
                    content: {
                        agentKey: myAgentPubKeyRef.current as AgentPubKey,
                        topicImageUrl: url,
                    },
                },
            }
            serviceRef.current!
                .notify(signal, peopleInRoom)
                .catch((error) => console.log(error))
        })
    }

    function signalNewBackground(type, url, startTime) {
        if (!serviceRef.current || !myAgentPubKeyRef.current) return
        const newSettings = {
            ...gameData,
            backgroundImage: type === 'image' ? url : '',
            backgroundVideo: type === 'video' ? url : '',
            backgroundVideoStartTime: startTime,
        }
        serviceRef.current.updateGame({ entryHash, newSettings }).then(() => {
            const signal: Signal = {
                gameHash: entryHash,
                message: {
                    type: 'NewBackground',
                    content: {
                        agentKey: myAgentPubKeyRef.current as AgentPubKey,
                        subType: type,
                        url,
                        startTime,
                    },
                },
            }
            serviceRef.current!
                .notify(signal, peopleInRoom)
                .catch((error) => console.log(error))
        })
    }

    function signalNewTopic(e) {
        e.preventDefault()
        if (!serviceRef.current || !myAgentPubKeyRef.current) return
        const newSettings = { ...gameData, topic: newTopic, topicGroup: '' }
        serviceRef.current.updateGame({ entryHash, newSettings }).then(() => {
            const signal: Signal = {
                gameHash: entryHash,
                message: {
                    type: 'NewTopic',
                    content: {
                        agentKey: myAgentPubKeyRef.current as AgentPubKey,
                        topic: newTopic,
                    },
                },
            }
            serviceRef.current!
                .notify(signal, peopleInRoom)
                .then(() => setTopicTextModalOpen(false))
                .catch((error) => console.log(error))
        })
    }

    function addPlayButtonToCenterBead() {
        Promise.all([d3.xml('/icons/play-solid.svg'), d3.xml('/icons/pause-solid.svg')]).then(
            ([play, pause]) => {
                const timerBead = d3.select('#timer-bead')
                timerBead.node().append(play.documentElement)
                timerBead.node().append(pause.documentElement)
                timerBead
                    .selectAll('svg')
                    .attr('width', 60)
                    .attr('height', 60)
                    .attr('x', -30)
                    .attr('y', -30)
                    .style('color', '#8ad1ff')
                    .style('cursor', 'pointer')

                const playButton = d3.select(timerBead.selectAll('svg').nodes()[0])
                const pauseButton = d3.select(timerBead.selectAll('svg').nodes()[1])
                playButton
                    .attr('id', 'play-button')
                    .attr('display', 'flex')
                    .classed('transitioning', true)
                    .style('opacity', 0)
                    .on('mouseover', () => {
                        if (!playButton.classed('transitioning'))
                            playButton.transition().duration(300).style('color', '#44b1f7')
                    })
                    .on('mouseout', () => {
                        if (!playButton.classed('transitioning'))
                            playButton.transition().duration(300).style('color', '#8ad1ff')
                    })
                    .on('mousedown', () => {
                        playButton.attr('display', 'none')
                        pauseButton.attr('display', 'flex')
                        const audio = d3
                            .select(`#gbg-bead-${postId}-${liveBeadIndexRef.current}-gbg`)
                            .select('audio')
                            .node()
                        if (audio) audio.play()
                    })
                    .transition()
                    .duration(1000)
                    .style('opacity', 1)
                    .on('end', () => playButton.classed('transitioning', false))
                pauseButton
                    .attr('id', 'pause-button')
                    .attr('display', 'none')
                    .classed('transitioning', false)
                    .on('mouseover', () => {
                        if (!pauseButton.classed('transitioning'))
                            pauseButton.transition().duration(300).style('color', '#44b1f7')
                    })
                    .on('mouseout', () => {
                        if (!pauseButton.classed('transitioning'))
                            pauseButton.transition().duration(300).style('color', '#8ad1ff')
                    })
                    .on('mousedown', () => {
                        pauseButton.attr('display', 'none')
                        playButton.attr('display', 'flex')
                        const audio = d3
                            .select(`#gbg-bead-${postId}-${liveBeadIndexRef.current}-gbg`)
                            .select('audio')
                            .node()
                        if (audio) audio.pause()
                    })
            }
        )
    }

    function addEventListenersToBead(beadIndex) {
        d3.select(`#gbg-bead-${postId}-${beadIndex}-gbg`)
            .select('audio')
            .on('play', () => {
                liveBeadIndexRef.current = beadIndex
                d3.select('#play-button').attr('display', 'none')
                d3.select('#pause-button').attr('display', 'flex')
            })
            .on('pause', () => {
                d3.select('#play-button').attr('display', 'flex')
                d3.select('#pause-button').attr('display', 'none')
            })
            .on('ended', () => {
                const totalBeads = d3.selectAll('.gbg-bead').nodes()
                if (beadIndex === totalBeads.length) {
                    liveBeadIndexRef.current = 1
                    d3.select('#play-button').attr('display', 'flex')
                    d3.select('#pause-button').attr('display', 'none')
                }
            })
    }

    function updateMobileTab(tab: 'comments' | 'game' | 'videos') {
        switch (tab) {
            case 'comments':
                if (showComments) {
                    setMobileTab('game')
                    setShowComments(false)
                } else {
                    setMobileTab('comments')
                    setShowComments(true)
                    updateShowVideos(false)
                }
                break
            case 'game':
                setMobileTab('game')
                setShowComments(false)
                updateShowVideos(false)
                break
            case 'videos':
                if (showVideos) {
                    setMobileTab('game')
                    updateShowVideos(false)
                } else {
                    setMobileTab('videos')
                    openVideoWall()
                    setShowComments(false)
                }
                break
            default:
                break
        }
    }

    function signalHandler(signal: HcSignal) {
        if (signal.type !== SignalType.App) return
        const payload = signal.value.payload as Signal | undefined
        if (!payload?.message) return
        const { type, content } = payload.message
        switch (type) {
            case 'NewPlayer': {
                const agentKey: AgentPubKey = content
                // Always reply with our live-state so the newcomer learns about us,
                // even if we already had them in our room list from a previous visit.
                holochainAudioRef.current?.announce('join', [agentKey])
                if (peopleInRoomRef.current.some((p) => eqKey(p, agentKey))) break
                setPeopleInRoom((p) =>
                    p.some((x) => eqKey(x, agentKey)) ? p : [...p, agentKey]
                )
                peopleInRoomRef.current.push(agentKey)
                nicknameFor(agentKey).then((name) => pushComment(`${name} entered the room`))
                break
            }
            case 'NewComment': {
                const { agentKey, text } = content
                pushUserComment(agentKey, text)
                break
            }
            case 'NewTopic': {
                const { agentKey, topic } = content
                setGameData((data) => ({ ...data, topic, topicGroup: '' }))
                nicknameFor(agentKey).then((name) => pushComment(`${name} updated the topic`))
                break
            }
            case 'NewTopicImage': {
                const { agentKey, topicImageUrl } = content
                setGameData((data) => ({ ...data, topicImageUrl }))
                nicknameFor(agentKey).then((name) =>
                    pushComment(`${name} updated the topic image`)
                )
                break
            }
            case 'NewBackground': {
                const { agentKey, subType, url, startTime } = content
                setGameData((data) => ({
                    ...data,
                    backgroundImage: subType === 'image' ? url : '',
                    backgroundVideo: subType === 'video' ? url : '',
                    backgroundVideoStartTime: startTime,
                }))
                nicknameFor(agentKey).then((name) =>
                    pushComment(`${name} updated the background`)
                )
                break
            }
            case 'StartGame': {
                const { agentKey, data } = content
                const parsedData = JSON.parse(data)
                if (Array.isArray(parsedData.players)) {
                    parsedData.players = parsedData.players.map((p: string) =>
                        decodeHashFromBase64(p)
                    )
                }
                setGameSettingsModalOpen(false)
                setGameData(parsedData)
                setGameInProgress(true)
                setBeads([])
                d3.select('#play-button')
                    .classed('transitioning', true)
                    .transition()
                    .duration(1000)
                    .style('opacity', 0)
                    .remove()
                d3.select('#pause-button')
                    .classed('transitioning', true)
                    .transition()
                    .duration(1000)
                    .style('opacity', 0)
                    .remove()
                liveBeadIndexRef.current = 1
                startGame(parsedData)
                nicknameFor(agentKey).then((name) => pushComment(`${name} started the game`))
                break
            }
            case 'StopGame': {
                const { agentKey } = content
                if (largeScreen) {
                    setShowComments(true)
                    updateShowVideos(true)
                }
                setGameInProgress(false)
                clearInterval(secondsTimerRef.current)
                d3.selectAll(`.${styles.playerState}`).text('')
                d3.select(`#game-arc`).remove()
                d3.select(`#turn-arc`).remove()
                d3.select(`#move-arc`).remove()
                d3.select('#timer-seconds').text('')
                addPlayButtonToCenterBead()
                setTurn(0)
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording')
                    mediaRecorderRef.current.stop()
                nicknameFor(agentKey).then((name) => pushComment(`${name} stopped the game`))
                break
            }
            case 'LeaveGame': {
                const { agentKey } = content
                nicknameFor(agentKey).then((name) => pushComment(`${name} left the room`))
                setPeopleInRoom((ps) => ps.filter((p) => !eqKey(p, agentKey)))
                peopleInRoomRef.current = peopleInRoomRef.current.filter(
                    (p) => !eqKey(p, agentKey)
                )
                holochainAudioRef.current?.forgetPeer(agentKey)
                if (livePeersRef.current.delete(encodeHashToBase64(agentKey))) {
                    bumpLivePeers()
                }
                const peerObject = peersRef.current.find((p) => eqKey(p.agentKey, agentKey))
                if (peerObject) {
                    peerObject.peer.destroy()
                    peersRef.current = peersRef.current.filter(
                        (p) => !eqKey(p.agentKey, agentKey)
                    )
                    videosRef.current = videosRef.current.filter(
                        (v) => !eqKey(v.agentKey, agentKey)
                    )
                }
                if (!videosRef.current.length && !streamRef.current) updateShowVideos(false)
                setPlayers((ps) => ps.filter((p) => !eqKey(p, agentKey)))
                break
            }
            case 'NewBead': {
                const { agentKey, audio, index } = content
                setBeads((previousBeads) => [...previousBeads, { agentKey, audio, index }])
                addEventListenersToBead(index)
                break
            }
            case 'NewSignalRequest': {
                const { agentKey, signal: signalString } = content
                const parsedSignal = JSON.parse(signalString)
                const existingPeer = peersRef.current.find((p) => eqKey(p.agentKey, agentKey))
                if (existingPeer) existingPeer.peer.signal(parsedSignal)
                else {
                    const peer = new Peer({
                        initiator: false,
                        stream: streamRef.current,
                        config: iceConfig,
                    })
                    peer.on('signal', (data) => {
                        const signalResponse: Signal = {
                            gameHash: entryHash,
                            message: {
                                type: 'NewSignalResponse',
                                content: {
                                    agentKey: myAgentPubKeyRef.current as AgentPubKey,
                                    signal: JSON.stringify(data),
                                },
                            },
                        }
                        serviceRef.current!
                            .notify(signalResponse, [agentKey])
                            .catch((error) => console.log('notify error: ', error))
                    })
                    peer.on('stream', (stream) => {
                        videosRef.current.push({
                            agentKey,
                            peer,
                            audioOnly: !stream.getVideoTracks().length,
                        })
                        nicknameFor(agentKey).then((name) =>
                            pushComment(`${name}'s video connected`)
                        )
                        addStreamToVideo(keyOf(agentKey), stream)
                        setPlayers((prev) => [...prev, agentKey])
                    })
                    peer.on('close', () => peer.destroy())
                    peer.on('error', (error) => console.log('error 2: ', error))
                    peer.signal(parsedSignal)
                    peersRef.current.push({ agentKey, peer })
                }
                break
            }
            case 'NewSignalResponse': {
                const { agentKey, signal: signalString } = content
                const parsedSignal = JSON.parse(signalString)
                const peerObject = peersRef.current.find((p) => eqKey(p.agentKey, agentKey))
                if (peerObject) {
                    if (peerObject.peer.readable) peerObject.peer.signal(parsedSignal)
                    else {
                        peerObject.peer.destroy()
                        peersRef.current = peersRef.current.filter(
                            (p) => !eqKey(p.agentKey, agentKey)
                        )
                    }
                }
                break
            }
            case 'RefreshRequest': {
                const { agentKey } = content
                const peerObject = peersRef.current.find((p) => eqKey(p.agentKey, agentKey))
                if (peerObject) {
                    peerObject.peer.destroy()
                    peersRef.current = peersRef.current.filter(
                        (p) => !eqKey(p.agentKey, agentKey)
                    )
                    videosRef.current = videosRef.current.filter(
                        (v) => !eqKey(v.agentKey, agentKey)
                    )
                    setPlayers((ps) => ps.filter((p) => !eqKey(p, agentKey)))
                }
                break
            }
            case 'ModuleData': {
                const { fromAgent, msgType, payload: modulePayload } = content
                if (msgType === HOLOCHAIN_AUDIO_MSG_TYPE) {
                    const keyB64 = encodeHashToBase64(fromAgent)
                    // Voice arrival is itself proof the peer is live.
                    if (!livePeersRef.current.has(keyB64)) {
                        livePeersRef.current.add(keyB64)
                        bumpLivePeers()
                        setPlayers((prev) =>
                            prev.some((p) => eqKey(p, fromAgent)) ? prev : [...prev, fromAgent]
                        )
                    }
                    holochainAudioRef.current?.receiveFrame(fromAgent, modulePayload)
                } else if (msgType === HOLOCHAIN_AUDIO_ANNOUNCE_TYPE) {
                    let parsed: { action?: 'join' | 'leave'; muted?: boolean }
                    try {
                        parsed = JSON.parse(modulePayload)
                    } catch {
                        break
                    }
                    const keyB64 = encodeHashToBase64(fromAgent)
                    if (parsed.action === 'join') {
                        const wasKnown = livePeersRef.current.has(keyB64)
                        if (!wasKnown) {
                            livePeersRef.current.add(keyB64)
                            bumpLivePeers()
                        }
                        if (typeof parsed.muted === 'boolean') {
                            peerMutedRef.current.set(keyB64, parsed.muted)
                            bumpLivePeers()
                        }
                        // Only reply once: when we first hear from this peer.
                        // Replying every time creates an infinite ping-pong.
                        if (!wasKnown && holochainAudioRef.current) {
                            holochainAudioRef.current.announce('join', [fromAgent])
                        }
                        setPlayers((prev) =>
                            prev.some((p) => eqKey(p, fromAgent)) ? prev : [...prev, fromAgent]
                        )
                    } else if (parsed.action === 'leave') {
                        if (livePeersRef.current.delete(keyB64)) bumpLivePeers()
                        peerMutedRef.current.delete(keyB64)
                        holochainAudioRef.current?.forgetPeer(fromAgent)
                        setPlayers((prev) => prev.filter((p) => !eqKey(p, fromAgent)))
                    }
                } else if (msgType === HOLOCHAIN_AUDIO_MUTE_TYPE) {
                    let parsed: { muted?: boolean }
                    try {
                        parsed = JSON.parse(modulePayload)
                    } catch {
                        break
                    }
                    if (typeof parsed.muted === 'boolean') {
                        peerMutedRef.current.set(encodeHashToBase64(fromAgent), parsed.muted)
                        bumpLivePeers()
                    }
                }
                break
            }
            case 'StreamDisconnected': {
                const { agentKey } = content
                videosRef.current = videosRef.current.filter((v) => !eqKey(v.agentKey, agentKey))
                if (!videosRef.current.length && !streamRef.current) updateShowVideos(false)
                setPlayers((ps) => ps.filter((p) => !eqKey(p, agentKey)))
                if (!eqKey(agentKey, myAgentPubKeyRef.current)) {
                    nicknameFor(agentKey).then((name) =>
                        pushComment(`${name}'s stream disconnected`)
                    )
                }
                break
            }
            default:
                break
        }
    }

    async function initialiseGame() {
        if (!serviceRef.current || !myAgentPubKeyRef.current) return
        const me = myAgentPubKeyRef.current
        const { settings: game } = await serviceRef.current.getGame(entryHash)
        const playersArray = dedupeKeys(await serviceRef.current.getPlayers(entryHash))
        const gameComments = await serviceRef.current.getComments(entryHash)
        const gameBeads = await serviceRef.current.getBeads(entryHash)
        setGameData(game)
        setPeopleInRoom(playersArray)
        peopleInRoomRef.current = playersArray
        setComments(
            gameComments.map((c) => ({
                id: uuidv4(),
                agentKey: c.agentKey,
                text: c.text,
                timestamp: new Date(Number(c.timestamp) / 1000).toISOString(),
            }))
        )
        if (gameBeads.length) {
            setGameData((d) => ({ ...d, locked: true }))
            setBeads(
                gameBeads.map((b) => ({
                    agentKey: b.agentKey,
                    audio: b.bead.audio,
                    index: b.bead.index,
                }))
            )
        }
        playersArray
            .filter((p) => !eqKey(p, me))
            .forEach((agentKey) => {
                const peerObject = peersRef.current.find((p) => eqKey(p.agentKey, agentKey))
                if (peerObject) {
                    peerObject.peer.destroy()
                    peersRef.current = peersRef.current.filter(
                        (p) => !eqKey(p.agentKey, agentKey)
                    )
                    videosRef.current = videosRef.current.filter(
                        (v) => !eqKey(v.agentKey, agentKey)
                    )
                }
                const peer = new Peer({
                    initiator: true,
                    config: iceConfig,
                })
                peer.on('signal', (data) => {
                    const signal: Signal = {
                        gameHash: entryHash,
                        message: {
                            type: 'NewSignalRequest',
                            content: {
                                agentKey: me,
                                signal: JSON.stringify(data),
                            },
                        },
                    }
                    serviceRef.current!
                        .notify(signal, [agentKey])
                        .catch((error) => console.log('notify error: ', error))
                })
                peer.on('stream', (stream) => {
                    videosRef.current.push({
                        agentKey,
                        peer,
                        audioOnly: !stream.getVideoTracks().length,
                    })
                    nicknameFor(agentKey).then((name) =>
                        pushComment(`${name}'s video connected`)
                    )
                    addStreamToVideo(keyOf(agentKey), stream)
                    setPlayers((prev) => [...prev, agentKey])
                })
                peer.on('close', () => peer.destroy())
                peer.on('error', (error) => console.log(error))
                peersRef.current.push({ agentKey, peer })
            })
        const alreadyJoined = playersArray.some((p) => eqKey(p, me))
        if (!alreadyJoined) {
            try {
                const res = await serviceRef.current.joinGame({ agentKey: me, entryHash })
                joinGameHash.current = res
                setPeopleInRoom((p) =>
                    p.some((x) => eqKey(x, me)) ? p : [...p, me]
                )
                if (!peopleInRoomRef.current.some((p) => eqKey(p, me))) {
                    peopleInRoomRef.current.push(me)
                }
            } catch (error) {
                console.log(error)
            }
        }
        const others = playersArray.filter((p) => !eqKey(p, me))
        if (others.length > 0) {
            const signal: Signal = {
                gameHash: entryHash,
                message: { type: 'NewPlayer', content: me },
            }
            serviceRef.current
                .notify(signal, others)
                .catch((error) => console.log('notify error: ', error))
        }
    }

    async function leaveGame() {
        if (!serviceRef.current || !myAgentPubKeyRef.current) return
        if (!joinGameHash.current) return
        const me = myAgentPubKeyRef.current
        const otherPlayers = peopleInRoomRef.current.filter((p) => !eqKey(p, me))
        const signal: Signal = {
            gameHash: entryHash,
            message: { type: 'LeaveGame', content: { agentKey: me } },
        }
        try {
            await serviceRef.current.notify(signal, otherPlayers)
            await serviceRef.current.leaveGame(joinGameHash.current)
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        if (!ctx) return
        if (initialisedRef.current) return
        initialisedRef.current = true
        serviceRef.current = ctx.service
        myAgentPubKeyRef.current = ctx.service.myAgentPubKey
        const unsub = ctx.client.on('signal', signalHandler)
        initialiseGame()
        return () => {
            try {
                if (typeof unsub === 'function') (unsub as any)()
            } catch {
                /* ignore */
            }
            leaveGame()
            if (levelTickIntervalRef.current) {
                clearInterval(levelTickIntervalRef.current)
                levelTickIntervalRef.current = null
            }
            if (holochainAudioRef.current) {
                const audio = holochainAudioRef.current
                holochainAudioRef.current = null
                audio.stop().catch(() => {})
            }
            initialisedRef.current = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ctx])

    useEffect(() => {
        const loadingAnimationDuration = 2000
        const timerFadeInDuration = 3000

        const width = 500
        const center = width / 2
        const circleWidth = 100
        const circleOffset = circleWidth * (13 / 15)

        const loadingAnimationSVG = d3
            .select('#loading-animation')
            .append('svg')
            .attr('id', 'loading-animation-svg')
            .attr('viewBox', `0 0 ${width} ${width}`)
            .attr('perserveAspectRatio', 'xMinYMin')
            .attr('style', 'max-width: 500px')

        function createCircle(id, cx, cy) {
            loadingAnimationSVG
                .append('circle')
                .attr('id', id)
                .attr('stroke', 'black')
                .attr('fill', 'none')
                .attr('stroke-width', 2)
                .attr('r', circleWidth)
                .attr('cx', cx)
                .attr('cy', cy)
        }

        createCircle('center', center, center)
        createCircle('center-top', center, center - circleWidth)
        createCircle('center-bottom', center, center + circleWidth)
        createCircle('left-top', center - circleOffset, center - circleWidth / 2)
        createCircle('left-bottom', center - circleOffset, center + circleWidth / 2)
        createCircle('right-top', center + circleOffset, center - circleWidth / 2)
        createCircle('right-bottom', center + circleOffset, center + circleWidth / 2)

        function animateCircle(id, offset) {
            d3.select(`#${id}`)
                .transition()
                .ease(d3.easeCubicInOut)
                .duration(3000)
                .attr('cx', center + offset)
                .on('end', () => {
                    d3.select(`#${id}`)
                        .transition()
                        .ease(d3.easeCubicInOut)
                        .duration(3000)
                        .attr('cx', center - offset)
                        .on('end', () => {
                            animateCircle(id, offset)
                        })
                })
        }

        roomIntro.play()
        animateCircle('left-top', circleOffset)
        animateCircle('left-bottom', circleOffset)
        animateCircle('right-top', -circleOffset)
        animateCircle('right-bottom', -circleOffset)

        setTimeout(() => {
            const loadingAnimation = d3.select('#loading-animation')
            if (loadingAnimation) loadingAnimation.style('opacity', 0)
            setTimeout(() => {
                setShowLoadingAnimation(false)
                if (largeScreen) setShowComments(true)
            }, 1000)
        }, loadingAnimationDuration)

        const svg = d3
            .select('#timer-canvas')
            .append('svg')
            .attr('id', 'timer-svg')
            .attr('viewBox', `0 0 ${gameArcRadius * 2} ${gameArcRadius * 2}`)
            .attr('perserveAspectRatio', 'xMaxYMax')

        const imageDefs = svg.append('defs').attr('id', 'image-defs')

        function createTimerGroup(id: string) {
            return svg
                .append('g')
                .attr('id', id)
                .attr('transform', `translate(${gameArcRadius},${gameArcRadius})`)
        }

        const timerBackground = createTimerGroup('timer-background')
        createTimerGroup('timer-arcs')
        const timerText = createTimerGroup('timer-text')
        const timerBead = createTimerGroup('timer-bead')

        function createArcBarckground(type: 'game' | 'turn' | 'move', color: string) {
            timerBackground
                .append('path')
                .datum({ startAngle: 0, endAngle: 2 * Math.PI })
                .attr('id', `${type}-arc-background`)
                .style('fill', color)
                .style('opacity', 0.8)
                .attr('d', arcs[`${type}Arc`])
        }

        function createArcTitle(text: string, fontSize: number, yOffset: number, id?: string) {
            timerText
                .append('text')
                .text(text)
                .attr('id', id)
                .attr('text-anchor', 'middle')
                .attr('font-size', `${fontSize}px`)
                .attr('x', 0)
                .attr('y', yOffset)
                .style('opacity', 0)
                .transition()
                .delay(loadingAnimationDuration)
                .duration(timerFadeInDuration)
                .style('opacity', 1)
        }

        createArcBarckground('game', colors.grey1)
        createArcBarckground('turn', colors.grey2)
        createArcBarckground('move', colors.grey3)
        createArcTitle('Game', 16, -194)
        createArcTitle('Turn', 16, -164)
        createArcTitle('Move', 16, -134, 'timer-move-state')
        createArcTitle('', 24, -98, 'timer-seconds')

        timerBead
            .append('rect')
            .attr('x', -80)
            .attr('y', -80)
            .attr('width', 160)
            .attr('height', 160)
            .attr('rx', 10)
            .attr('ry', 10)
            .attr('fill', 'white')

        imageDefs
            .append('pattern')
            .attr('id', 'wave-form-pattern')
            .attr('height', 1)
            .attr('width', 1)
            .append('image')
            .attr('id', 'wave-form-image')
            .attr('height', 120)
            .attr('xlink:href', '/icons/gbg/sound-wave.png')

        timerBead
            .append('rect')
            .attr('width', 120)
            .attr('height', 120)
            .attr('x', -60)
            .attr('y', -60)
            .style('fill', 'url(#wave-form-pattern)')
    }, [])

    return (
        <Column className={styles.wrapper}>
            {showLoadingAnimation && (
                <div className={styles.loadingAnimation} id='loading-animation' />
            )}
            {gameData.backgroundVideo && (
                <iframe
                    className={styles.backgroundVideo}
                    title='background video'
                    src={`https://www.youtube.com/embed/${gameData.backgroundVideo}?start=${
                        gameData.backgroundVideoStartTime || 1
                    }&autoplay=1&mute=1&enablejsapi=1`}
                />
            )}
            {gameData.backgroundImage && (
                <img className={styles.backgroundImage} src={gameData.backgroundImage} alt='' />
            )}
            {alertModalOpen && (
                <Modal centered close={() => setAlertModalOpen(false)}>
                    <h1>{alertMessage}</h1>
                    <Button text='Ok' color='blue' onClick={() => setAlertModalOpen(false)} />
                </Modal>
            )}
            {backgroundModalOpen && (
                <GBGBackgroundModal
                    gameData={gameData}
                    signalNewBackground={(type, url, startTime) =>
                        signalNewBackground(type, url, startTime)
                    }
                    close={() => setBackgroundModalOpen(false)}
                />
            )}
            {topicTextModalOpen && (
                <Modal centered close={() => setTopicTextModalOpen(false)}>
                    <h1>Change the topic</h1>
                    <p>Current topic: {gameData.topic}</p>
                    <form onSubmit={signalNewTopic}>
                        <Input
                            type='text'
                            placeholder='new topic...'
                            value={newTopic}
                            onChange={(v) => setNewTopic(v)}
                            style={{ marginBottom: 30 }}
                        />
                        <Button text='Save' color='blue' disabled={!newTopic} submit />
                    </form>
                </Modal>
            )}
            {topicImageModalOpen && (
                <ImageUploadModal
                    type='gbg-topic'
                    shape='circle'
                    id={postId as any}
                    title='Add a new topic image'
                    mbLimit={2}
                    onSaved={(imageURL) => signalNewTopicImage(imageURL)}
                    close={() => setTopicImageModalOpen(false)}
                />
            )}
            {helpModalOpen && <HelpModal close={() => setHelpModalOpen(false)} />}
            <Row centerY className={styles.mobileHeader}>
                <button
                    type='button'
                    onClick={() => updateMobileTab('comments')}
                    className={`${mobileTab === 'comments' && styles.selected}`}
                >
                    <CommentIconSVG />
                </button>
                <button
                    type='button'
                    onClick={() => updateMobileTab('game')}
                    className={`${mobileTab === 'game' && styles.selected}`}
                >
                    <CastaliaIconSVG />
                </button>
                <button
                    type='button'
                    onClick={() => updateMobileTab('videos')}
                    className={`${mobileTab === 'videos' && styles.selected}`}
                >
                    <VideoIconSVG />
                </button>
            </Row>
            <Row
                spaceBetween
                className={`${styles.mainContent} ${beads.length && styles.showBeads}`}
            >
                <Column
                    spaceBetween
                    className={`${styles.commentBar} ${!showComments && styles.hidden} ${
                        (gameData.backgroundImage || gameData.backgroundVideo) && styles.transparent
                    }`}
                >
                    <Scrollbars className={styles.comments} autoScrollToBottom>
                        {comments.map((comment) => (
                            <Comment
                                key={comment.id}
                                comment={comment}
                                myAgentPubKey={myAgentPubKeyRef.current}
                            />
                        ))}
                    </Scrollbars>
                    <form className={styles.commentInput} onSubmit={createComment}>
                        <Input
                            type='text'
                            placeholder='comment...'
                            value={newComment}
                            onChange={(v) => setNewComment(v)}
                            style={{ marginRight: 10 }}
                        />
                        <Button text='Send' color='blue' submit />
                    </form>
                    <button
                        className={styles.closeCommentsButton}
                        onClick={() => setShowComments(!showComments)}
                        type='button'
                    >
                        <ChevronUpIconSVG transform={`rotate(${showComments ? 270 : 90})`} />
                    </button>
                </Column>
                <Column
                    centerX
                    className={`${styles.centerPanel} ${
                        !largeScreen && showVideos && styles.hidden
                    }`}
                >
                    {gameInProgress ? (
                        <Column className={`${styles.gameControls} ${largeScreen && styles.large}`}>
                            <Button
                                text='Stop game'
                                color='red'
                                size={largeScreen ? 'large' : 'small'}
                                style={{ marginBottom: 10 }}
                                onClick={signalStopGame}
                            />
                            <p>{`Turn ${turn} / ${gameData.numberOfTurns}`}</p>
                            {players.map((player, index) => (
                                <Row centerY key={keyOf(player)} className={styles.player}>
                                    <div className={styles.position}>{index + 1}</div>
                                    <PlayerRow
                                        agentKey={player}
                                        myAgentPubKey={myAgentPubKeyRef.current}
                                        fontSize={largeScreen ? 16 : 10}
                                        imageSize={largeScreen ? 35 : 20}
                                        style={{ marginRight: largeScreen ? 10 : 5 }}
                                    />
                                    <p
                                        id={`player-${keyOf(player)}`}
                                        className={styles.playerState}
                                    />
                                </Row>
                            ))}
                        </Column>
                    ) : (
                        <Column className={styles.gameControls}>
                            {gameData.locked && (
                                <Row centerY className={styles.gameLocked}>
                                    <LockIconSVG />
                                    <p>Game locked</p>
                                </Row>
                            )}
                            <Button
                                text='Leave game room'
                                color='purple'
                                size={largeScreen ? 'large' : 'small'}
                                style={{ marginBottom: 10 }}
                                onClick={() => setLeaveRoomModalOpen(true)}
                            />
                            {leaveRoomModalOpen && (
                                <Modal centered close={() => setLeaveRoomModalOpen(false)}>
                                    <h1>Are you sure you want to leave?</h1>
                                    <Row wrap>
                                        <Button
                                            text='Yes, leave room'
                                            color='red'
                                            style={{ marginRight: 10, marginBottom: 10 }}
                                            onClick={() => history.push('/')}
                                        />
                                        <Button
                                            text='No, cancel'
                                            color='blue'
                                            style={{ marginBottom: 10 }}
                                            onClick={() => setLeaveRoomModalOpen(false)}
                                        />
                                    </Row>
                                </Modal>
                            )}
                            {!gameData.locked && !beads.length && (
                                <Button
                                    text='Start game'
                                    color={beads.length ? 'red' : 'blue'}
                                    size={largeScreen ? 'large' : 'small'}
                                    style={{ marginBottom: 10 }}
                                    onClick={() =>
                                        allowedTo('start-game') && setGameSettingsModalOpen(true)
                                    }
                                />
                            )}
                            <Button
                                text={`${
                                    gameData.backgroundImage || gameData.backgroundVideo
                                        ? 'Change'
                                        : 'Add'
                                } background`}
                                color='grey'
                                size={largeScreen ? 'large' : 'small'}
                                style={{ marginBottom: 10 }}
                                onClick={() =>
                                    allowedTo('change-background') && setBackgroundModalOpen(true)
                                }
                            />
                        </Column>
                    )}
                    {gameSettingsModalOpen && myAgentPubKeyRef.current && (
                        <GameSettingsModal
                            close={() => setGameSettingsModalOpen(false)}
                            gameData={gameData}
                            myAgentPubKey={myAgentPubKeyRef.current}
                            players={players}
                            setPlayers={setPlayers}
                            signalStartGame={signalStartGame}
                        />
                    )}
                    <Column centerX className={styles.timerColumn}>
                        <CurvedDNASVG
                            className={`${styles.curvedDNA} ${beads.length && styles.withBeads}`}
                        />
                        <Row centerY className={styles.topicText}>
                            <h1>{gameData.topic}</h1>
                            <button
                                type='button'
                                onClick={() =>
                                    allowedTo('change-topic-text') && setTopicTextModalOpen(true)
                                }
                            >
                                <EditIconSVG />
                            </button>
                        </Row>
                        <Row centerY centerX className={styles.topicImage}>
                            {gameData.topicImageUrl && <img src={gameData.topicImageUrl} alt='' />}
                            <button
                                type='button'
                                className={styles.uploadTopicImageButton}
                                onClick={() =>
                                    allowedTo('change-topic-image') && setTopicImageModalOpen(true)
                                }
                            >
                                <p>Add a new topic image</p>
                            </button>
                        </Row>
                        <Column className={styles.timerContainer}>
                            <div id='timer-canvas' className={styles.timer} />
                        </Column>
                    </Column>
                    {largeScreen && (
                        <Column className={styles.people}>
                            <ConnectControl
                                mode={connectionMode}
                                loading={loadingStream}
                                menuOpen={connectMenuOpen}
                                onMenuToggle={() => setConnectMenuOpen((o) => !o)}
                                onMenuClose={() => setConnectMenuOpen(false)}
                                onPickWebRTC={() => {
                                    setConnectMenuOpen(false)
                                    if (allowedTo('stream')) connectWebRTC()
                                }}
                                onPickHolochain={() => {
                                    setConnectMenuOpen(false)
                                    if (allowedTo('stream')) connectHolochain()
                                }}
                                onDisconnect={disconnect}
                            />
                            {videosRef.current.length + (userIsStreaming ? 1 : 0) > 0 && (
                                <Button
                                    color='blue'
                                    text={`${showVideos ? 'Hide' : 'Show'} videos`}
                                    onClick={() =>
                                        showVideos ? updateShowVideos(false) : openVideoWall()
                                    }
                                    style={{ marginBottom: 10, alignSelf: 'flex-start' }}
                                />
                            )}
                            <Column className={styles.peopleStreaming}>
                                {!showVideos && (
                                    <Column style={{ marginBottom: 10 }}>
                                        <p style={{ marginBottom: 10 }}>{peopleStreamingText()}</p>
                                        {userIsStreaming && myAgentPubKeyRef.current && (
                                            <PlayerRow
                                                agentKey={myAgentPubKeyRef.current}
                                                myAgentPubKey={myAgentPubKeyRef.current}
                                                fontSize={16}
                                                imageSize={40}
                                                style={{ marginBottom: 10 }}
                                            />
                                        )}
                                        {videosRef.current.map((v) => (
                                            <PlayerRow
                                                key={keyOf(v.agentKey)}
                                                agentKey={v.agentKey}
                                                myAgentPubKey={myAgentPubKeyRef.current}
                                                fontSize={16}
                                                imageSize={40}
                                                style={{ marginBottom: 10 }}
                                            />
                                        ))}
                                    </Column>
                                )}
                            </Column>
                            <Column className={styles.peopleInRoom}>
                                <p style={{ marginBottom: 10 }}>{peopleInRoomText()}</p>
                                {peopleInRoom.map((agentKey) => {
                                    const isMe = eqKey(agentKey, myAgentPubKeyRef.current)
                                    const keyB64 = keyOf(agentKey)
                                    const isLive =
                                        (isMe && connectionMode === 'holochain') ||
                                        (!isMe && livePeersRef.current.has(keyB64))
                                    return (
                                        <LiveRoomPlayerRow
                                            key={keyB64}
                                            agentKey={agentKey}
                                            myAgentPubKey={myAgentPubKeyRef.current}
                                            isLive={isLive}
                                            isMe={isMe}
                                            muted={
                                                isMe
                                                    ? holochainMuted
                                                    : peerMutedRef.current.get(keyB64) ?? false
                                            }
                                            level={
                                                isLive
                                                    ? isMe
                                                        ? holochainAudioRef.current?.getLocalLevel() ?? 0
                                                        : holochainAudioRef.current?.getPeerLevel(agentKey) ?? 0
                                                    : 0
                                            }
                                            onToggleMute={
                                                isMe && connectionMode === 'holochain'
                                                    ? toggleHolochainMute
                                                    : undefined
                                            }
                                        />
                                    )
                                })}
                            </Column>
                        </Column>
                    )}
                </Column>
                <Scrollbars
                    className={`${styles.videos} ${findVideoSize()} ${
                        !showVideos && styles.hidden
                    }`}
                >
                    {!largeScreen && (
                        <ConnectControl
                            mode={connectionMode}
                            loading={loadingStream}
                            menuOpen={connectMenuOpen}
                            onMenuToggle={() => setConnectMenuOpen((o) => !o)}
                            onMenuClose={() => setConnectMenuOpen(false)}
                            onPickWebRTC={() => {
                                setConnectMenuOpen(false)
                                if (allowedTo('stream')) connectWebRTC()
                            }}
                            onPickHolochain={() => {
                                setConnectMenuOpen(false)
                                if (allowedTo('stream')) connectHolochain()
                            }}
                            onDisconnect={disconnect}
                        />
                    )}
                    {userIsStreaming && myAgentPubKeyRef.current && (
                        <Video
                            id='your-video'
                            agentKey={myAgentPubKeyRef.current}
                            size={findVideoSize()}
                            audioEnabled={audioTrackEnabled}
                            videoEnabled={videoTrackEnabled}
                            toggleAudio={toggleAudioTrack}
                            toggleVideo={toggleVideoTrack}
                            audioOnly={audioOnly}
                        />
                    )}
                    {videosRef.current.map((v) => (
                        <Video
                            key={keyOf(v.agentKey)}
                            id={keyOf(v.agentKey)}
                            agentKey={v.agentKey}
                            size={findVideoSize()}
                            audioOnly={v.audioOnly}
                            refreshStream={refreshStream}
                        />
                    ))}
                </Scrollbars>
            </Row>
            <Scrollbars
                className={`${styles.beads} ${!beads.length && styles.hidden} ${
                    (gameData.backgroundImage || gameData.backgroundVideo) && styles.transparent
                } row`}
            >
                <Row centerY style={{ width: 'max-content' }}>
                    {beads.map((bead, beadIndex) => (
                        <Row
                            centerY
                            key={`${postId}-${bead.index}`}
                            style={{ paddingRight: beads.length === beadIndex + 1 ? 20 : 0 }}
                        >
                            <BeadCard
                                postId={postId}
                                location='gbg'
                                agentKey={bead.agentKey}
                                audio={bead.audio}
                                index={beadIndex + 1}
                                className={styles.bead}
                            />
                            {beads.length > beadIndex + 1 && (
                                <Row centerY className={styles.beadDivider}>
                                    <DNAIconSVG />
                                </Row>
                            )}
                        </Row>
                    ))}
                </Row>
            </Scrollbars>
            <button
                className={styles.helpButton}
                type='button'
                onClick={() => setHelpModalOpen(true)}
            >
                <HelpIcon />
            </button>
        </Column>
    )
}

export default GlassBeadGame
