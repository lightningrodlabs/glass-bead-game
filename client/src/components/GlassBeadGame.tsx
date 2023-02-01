/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-return-assign */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useState, useEffect, useRef } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import axios from 'axios'
import Peer from 'simple-peer'
import * as d3 from 'd3'
import { v4 as uuidv4 } from 'uuid'
import { AppWebsocket, InstalledCell } from '@holochain/client'
import { HolochainClient, CellClient } from '@holochain-open-dev/cell-client'
import GlassBeadGameService from '@src/glassbeadgame.service'
import styles from '@styles/components/GlassBeadGame.module.scss'
import config from '@src/Config'
import {
    isPlural,
    timeSinceCreated,
    dateCreated,
    notNull,
    allValid,
    defaultErrorState,
} from '@src/Helpers'
import {
    GameSettingsData,
    CreateOutput,
    GameOutput,
    GameData,
    JoinGameInput,
    IComment,
    NewCommentData,
    Bead,
    Signal,
    Message,
} from '@src/GameTypes'
import FlagImage from '@components/FlagImage'
import Modal from '@components/Modal'
import ImageUploadModal from '@components/Modals/ImageUploadModal'
import Input from '@components/Input'
import Button from '@components/Button'
import ImageTitle from '@components/ImageTitle'
import LoadingWheel from '@components/LoadingWheel'
import SuccessMessage from '@components/SuccessMessage'
import Row from '@components/Row'
import Column from '@components/Column'
import Scrollbars from '@components/Scrollbars'
import Markdown from '@components/Markdown'
import GBGBackgroundModal from '@components/Modals/GBGBackgroundModal'
import BeadCard from '@src/components/Cards/BeadCard'
import HelpModal from '@components/Modals/HelpModal'
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
        user,
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
                <ImageTitle
                    type='user'
                    imagePath={user.image}
                    title={id === 'your-video' ? 'You' : user.name}
                />
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
                    <button type='button' onClick={() => refreshStream(id, user)}>
                        <RefreshIconSVG />
                    </button>
                </div>
            )}
        </div>
    )
}

const Comment = (props) => {
    const { comment, myAgentPubKey } = props
    const { player, text, timestamp } = comment
    if (player)
        return (
            <Row className={styles.userComment}>
                <FlagImage type='user' size={40} imagePath={player.image} />
                <Column className={styles.textWrapper}>
                    <Row className={styles.header}>
                        <h1>{player.agentKey === myAgentPubKey ? 'You' : player.name}</h1>
                        <p title={dateCreated(timestamp)}>{timeSinceCreated(timestamp)}</p>
                    </Row>
                    <Markdown text={text} />
                </Column>
            </Row>
        )
    return (
        <Row className={styles.adminComment}>
            <p>{text}</p>
        </Row>
    )
}

const GameSettingsModal = (props) => {
    const { close, gameData, player, players, setPlayers, signalStartGame } = props

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
        setPlayersError(players.length ? '' : 'At least one player must be streaming')
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
                        <Column className={styles.setting}>
                            <Row centerY>
                                <h3>Intro duration (seconds)</h3>
                                <Input
                                    type='text'
                                    style={{ width: 200 }}
                                    disabled={loading || saved}
                                    state={introDuration.state}
                                    errors={introDuration.errors}
                                    value={introDuration.value}
                                    onChange={(v) =>
                                        updateValue('introDuration', +v.replace(/\D/g, ''))
                                    }
                                />
                            </Row>
                            <p>
                                Set time for a moment of introspection, silence or meditation before
                                the game.
                            </p>
                        </Column>
                        <Column className={styles.setting}>
                            <Row centerY>
                                <h3>Number of turns</h3>
                                <Input
                                    type='text'
                                    style={{ width: 200 }}
                                    disabled={loading || saved}
                                    state={numberOfTurns.state}
                                    errors={numberOfTurns.errors}
                                    value={numberOfTurns.value}
                                    onChange={(v) =>
                                        updateValue('numberOfTurns', +v.replace(/\D/g, ''))
                                    }
                                />
                            </Row>
                            <p>
                                Set the amount of turns for the players. The total number of moves
                                will be the number of turns times the amount of players.
                            </p>
                        </Column>
                        <Column className={styles.setting}>
                            <Row centerY>
                                <h3>Move duration (seconds)</h3>
                                <Input
                                    type='text'
                                    style={{ width: 200 }}
                                    disabled={loading || saved}
                                    state={moveDuration.state}
                                    errors={moveDuration.errors}
                                    value={moveDuration.value}
                                    onChange={(v) =>
                                        updateValue('moveDuration', +v.replace(/\D/g, ''))
                                    }
                                />
                            </Row>
                            <p>The length of each move in seconds.</p>
                        </Column>
                        <Column className={styles.setting}>
                            <Row centerY>
                                <h3>Interval duration (seconds)</h3>
                                <Input
                                    type='text'
                                    style={{ width: 200 }}
                                    disabled={loading || saved}
                                    state={intervalDuration.state}
                                    errors={intervalDuration.errors}
                                    value={intervalDuration.value}
                                    onChange={(v) =>
                                        updateValue('intervalDuration', +v.replace(/\D/g, ''))
                                    }
                                />
                            </Row>
                            <p>
                                Set a pause in between each move for players to pause, reflect,
                                prepare notes, or meditate.
                            </p>
                        </Column>
                        <Column className={styles.setting}>
                            <Row centerY>
                                <h3>Outro duration (seconds)</h3>
                                <Input
                                    type='text'
                                    style={{ width: 200 }}
                                    disabled={loading || saved}
                                    state={outroDuration.state}
                                    errors={outroDuration.errors}
                                    value={outroDuration.value}
                                    onChange={(v) =>
                                        updateValue('outroDuration', +v.replace(/\D/g, ''))
                                    }
                                />
                            </Row>
                            <p>
                                Set time for a moment of reflection, silence or meditation after the
                                game.
                            </p>
                        </Column>
                    </Column>
                    <Column style={{ marginBottom: 20, minWidth: 200 }}>
                        <h2 style={{ margin: 0, lineHeight: '20px' }}>Player order</h2>
                        {players.map((p, i) => (
                            <Row style={{ marginTop: 10 }} key={p.agentKey}>
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
                                <ImageTitle
                                    type='user'
                                    imagePath={p.image}
                                    title={p.agentKey === player.agentKey ? 'You' : p.name}
                                    fontSize={16}
                                    imageSize={35}
                                />
                            </Row>
                        ))}
                        {!players.length && <p className={styles.grey}>No users connected...</p>}
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

const GlassBeadGame = (): JSX.Element => {
    const history = useHistory()
    const location = useLocation()
    const entryHash = location.pathname.split('/')[2]
    const loggedIn = true
    const postData = {
        id: 1,
    }
    const gbgServiceRef = useRef<any>()
    const myAgentPubKeyRef = useRef<any>()
    const joinGameHash = useRef<any>()
    const playerRef = useRef<any>({ agentKey: '', name: '', image: '' })
    const peopleInRoomRef = useRef<any>([])

    const [gameData, setGameData] = useState<any>(gameDefaults)
    const [gameInProgress, setGameInProgress] = useState(false)
    const [userIsStreaming, setUserIsStreaming] = useState(false)
    const [peopleInRoom, setPeopleInRoom] = useState<any[]>([])
    const [players, setPlayers] = useState<any[]>([])
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
    const [backgroundModalOpen, setBackgroundModalOpen] = useState(false)
    const [showLoadingAnimation, setShowLoadingAnimation] = useState(true)
    const [topicImageModalOpen, setTopicImageModalOpen] = useState(false)
    const [topicTextModalOpen, setTopicTextModalOpen] = useState(false)
    const [leaveRoomModalOpen, setLeaveRoomModalOpen] = useState(false)
    const [mobileTab, setMobileTab] = useState<'comments' | 'game' | 'videos'>('game')
    const [alertMessage, setAlertMessage] = useState('')
    const [alertModalOpen, setAlertModalOpen] = useState(false)
    const [helpModalOpen, setHelpModalOpen] = useState(false)

    // state refs (used for up to date values between renders)
    const roomIdRef = useRef<number>()
    const socketRef = useRef<any>(null)
    const socketIdRef = useRef('')
    const peersRef = useRef<any[]>([])
    const videosRef = useRef<any[]>([])
    const secondsTimerRef = useRef<any>(null)
    const mediaRecorderRef = useRef<any>(null)
    const chunksRef = useRef<any[]>([])
    const streamRef = useRef<any>(null)
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
        // iceTransportPolicy: 'relay',
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
            // { urls: `stun:${config.turnServerUrl}` },
            // {
            //     urls: `turn:${config.turnServerUrl}`,
            //     username: config.turnServerUsername,
            //     credential: config.turnServerPassword,
            // },
        ],
    }
    const totalUsersStreaming = videosRef.current.length + (userIsStreaming ? 1 : 0)
    const isYou = (id) => id === socketIdRef.current

    const isWeco = false
    const backendShim = {
        /// / DB queries

        // getGameData:
        // in weco we use the postId to find the game data in the db
        // in the holochain version posts aren't used so we'll pass in the gameId instead (retrieved from the page url, see line: 341 above)
        // below I've created a temporary promise to mimic the API request and return dummy game data so the page loads succesfully
        getGameData: (): Promise<any> => {
            return isWeco
                ? axios.get(`${config.apiURL}/glass-bead-game-data?postId=${postData.id}`)
                : new Promise((resolve, reject) => {
                      gbgServiceRef
                          .current!.getGame(entryHash)
                          .then((response) => resolve(response))
                          .catch((error) => console.log(error))
                  })
        },

        joinGame: (): Promise<any> => {
            return new Promise((resolve, reject) => {
                gbgServiceRef
                    .current!.joinGame({
                        agentKey: gbgServiceRef.current!.myAgentPubKey,
                        entryHash,
                    })
                    .then((response) => resolve(response))
                    .catch((error) => console.log(error))
            })
        },

        getPlayers: (): Promise<any> => {
            // entryHash: EntryHashB64
            return new Promise((resolve, reject) => {
                gbgServiceRef
                    .current!.getPlayers(entryHash)
                    .then((response) => resolve(response))
                    .catch((error) => console.log(error))
            })
        },

        // saveGameSettings:
        // once in a game room and streaming their audio/video a user can click the start game button
        // here they have the option to edit the games settings before they start the game
        // this includes the number of turns, length of intro, move, interval, and outro, and the player order
        // when they hit start game, it saves these updated settings in the backend using this API request
        // no data is returned to the client
        saveGameSettings: (data: GameSettingsData): Promise<void> => {
            return isWeco
                ? axios.post(`${config.apiURL}/save-glass-bead-game-settings`, data)
                : new Promise((resolve, reject) => resolve()) // updateGa,me(game: GameSettingsData): Promise<CreateOutput>
        },

        // saveComment:
        // when a user types in the input on the left hand comment bar and hits enter or clicks send their comment is saved in the db
        // no data is returned to the client
        saveComment: (data: IComment): Promise<CreateOutput> => {
            return isWeco
                ? axios.post(`${config.apiURL}/glass-bead-game-comment`, data)
                : gbgServiceRef.current!.createComment(data)
        },

        getComments: (input: any): Promise<any> => {
            return gbgServiceRef.current!.getComments(input)
        },

        // uploadBeadAudio:
        // after a players move has finished recording it is sent up to the server to be converted from a raw audio Blob to an mp3 file and then stored on the backend
        // after being stored, a url (string) pointing to the files location is returned to the client
        uploadBeadAudio: (formData: FormData): Promise<{ data: string }> => {
            return isWeco
                ? axios.post(`${config.apiURL}/audio-upload`, formData, {
                      headers: { 'Content-Type': 'multipart/form-data' },
                  })
                : new Promise((resolve, reject) => resolve({ data: '' })) // No Holochain API yet
        },

        // saveGame:
        // after all the players have finished their moves and the timer has finished, the option to save the game appears
        // when a user clicks the save game button, this API request is fired sending up the gameId and bead data to the backend
        // the beads are then saved in the db and linked to the game so they can be retrieved by other users opening the game room in the future
        // no data is returned to the client
        saveGame: (gameId: number, gameBeads: Bead[]): Promise<void> => {
            return isWeco
                ? axios.post(`${config.apiURL}/save-glass-bead-game`, { gameId, beads: gameBeads })
                : new Promise((resolve, reject) => resolve()) // for each createBead(input: Bead): Promise<CreateOutput>
        },

        // updateTopic:
        // this request updates the games topic only
        // no data is returned to the client
        updateTopic: (gameId: number, topic: string): Promise<void> => {
            return isWeco
                ? axios.post(`${config.apiURL}/save-gbg-topic`, { gameId, newTopic: topic })
                : new Promise((resolve, reject) => resolve()) // No Holochain API yet
        },

        /// / WebRTC signals:

        // on weco we're using socket.io (https://socket.io/) to send real-time webrtc signals between users in each game room.
        // once the socket is initialised (on line: 1305), signals are emitted by passing in the signal name (string) and signal data (any).
        // client side example: socket.emit('signalName', data)
        // on the server (https://github.com/wecollective/rest-api/blob/develop/Server.js) we listen for those signals and handle them there, usually relaying the data to other users:
        // server side example: socket.on('signalName', data => { do something here... then: io.in(roomId).emit('signalName', newData) })
        // then back on the client we listen for signals sent from the server:
        // client side example: socket.on('signalName', data => { do something here... })
        // to recreate this functionality on holochain I think we'll need to replace the socket instance with something that works without a central server
        socket: isWeco ? socketRef.current : null, // holochain socket instance

        // below is a list of the signals we emit from the client side:
        // 'outgoing-join-room'
        // 'outgoing-signal-request'
        // 'outgoing-signal'
        // 'outgoing-refresh-request'
        // 'outgoing-comment'
        // 'outgoing-start-game'
        // 'outgoing-stop-game'
        // 'outgoing-save-game'
        // 'outgoing-audio-bead'
        // 'outgoing-new-topic-text'
        // 'outgoing-new-topic-image'
        // 'outgoing-new-background'
        // 'outgoing-stream-disconnected'

        // and here is a list of signals we listen for:
        // 'incoming-room-joined'
        // 'incoming-user-joined'
        // 'incoming-signal-request'
        // 'incoming-signal'
        // 'incoming-refresh-request'
        // 'incoming-comment'
        // 'incoming-start-game'
        // 'incoming-stop-game'
        // 'incoming-save-game'
        // 'incoming-audio-bead'
        // 'incoming-new-topic-text'
        // 'incoming-new-topic-image'
        // 'incoming-new-background'
        // 'incoming-stream-disconnected'
        // 'incoming-user-left'

        // you can search for each signal in the code using the names above to see what data is passed in or recieved

        // we're also using simple-peer (https://www.npmjs.com/package/simple-peer) to enable audio video streaming between users
        // when we have a better understanding of how that will be approached in holochain we might add that to the shim as well
    }

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

    function toggleStream() {
        if (userIsStreaming) {
            // close stream
            videoRef.current.pause()
            videoRef.current.srcObject = null
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
            setUserIsStreaming(false)
            setAudioTrackEnabled(true)
            setVideoTrackEnabled(true)
            const signal: Signal = {
                gameHash: entryHash,
                message: {
                    type: 'StreamDisconnected',
                    content: {
                        agentKey: myAgentPubKeyRef.current,
                    },
                },
            }
            gbgServiceRef
                .current!.notify(
                    signal,
                    peopleInRoom.map((p) => p.agentKey)
                )
                .catch((error) => console.log('notify error: ', error))
            if (!videosRef.current.length) {
                updateShowVideos(false)
                updateMobileTab('game')
            }
        } else {
            // set up and signal stream
            setLoadingStream(true)
            navigator.mediaDevices
                .getUserMedia({ video: { width: 427, height: 240 }, audio: true })
                .then((stream) => {
                    setUserIsStreaming(true)
                    setAudioOnly(false)
                    streamRef.current = stream
                    // auto disable video and audio tracks when connected
                    // streamRef.current.getTracks().forEach((track) => (track.enabled = false))
                    peersRef.current.forEach((p) => p.peer.addStream(stream))
                    videoRef.current = document.getElementById('your-video')
                    videoRef.current.srcObject = stream
                    setPlayers((previousPlayers) => [...previousPlayers, playerRef.current])
                    setLoadingStream(false)
                    openVideoWall()
                })
                .catch(() => {
                    console.log('Unable to connect video, trying audio only...')
                    navigator.mediaDevices
                        .getUserMedia({ audio: true })
                        .then((stream) => {
                            setUserIsStreaming(true)
                            setAudioOnly(true)
                            streamRef.current = stream
                            streamRef.current
                                .getTracks()
                                .forEach((track) => (track.enabled = false))
                            peersRef.current.forEach((p) => p.peer.addStream(stream))
                            videoRef.current = document.getElementById('your-video')
                            videoRef.current.srcObject = stream
                            setPlayers((previousPlayers) => [...previousPlayers, playerRef.current])
                            setLoadingStream(false)
                            openVideoWall()
                        })
                        .catch(() => {
                            setAlertMessage('Unable to connect media devices')
                            setAlertModalOpen(true)
                            setLoadingStream(false)
                        })
                })
            // set up seperate audio stream for moves
            navigator.mediaDevices
                .getUserMedia({ audio: true })
                .then((audio) => (audioRef.current = audio))
        }
    }

    // todo: set up general createPeer function
    // function createPeer(isInitiator) {}

    function refreshStream(agentKey, player) {
        // signal refresh request
        const sig: Signal = {
            gameHash: entryHash,
            message: {
                type: 'RefreshRequest',
                content: {
                    agentKey: myAgentPubKeyRef.current,
                },
            },
        }
        gbgServiceRef
            .current!.notify(sig, [agentKey])
            .catch((error) => console.log('notify error: ', error))
        // destory old peer connection
        const peerObject = peersRef.current.find((p) => p.player.agentKey === agentKey)
        if (peerObject) {
            peerObject.peer.destroy()
            peersRef.current = peersRef.current.filter((p) => p.player.agentKey !== agentKey)
            videosRef.current = videosRef.current.filter((v) => v.player.agentKey !== agentKey)
            setPlayers((ps) => [...ps.filter((p) => p.agentKey !== agentKey)])
        }
        // create new peer connection
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
                        player: playerRef.current,
                        signal: JSON.stringify(data),
                    },
                },
            }
            gbgServiceRef
                .current!.notify(signal, [agentKey])
                .catch((error) => console.log('notify error: ', error))
        })
        peer.on('stream', (stream) => {
            videosRef.current.push({
                player,
                peer,
                audioOnly: !stream.getVideoTracks().length,
            })
            pushComment(`${player.name}'s video connected`)
            addStreamToVideo(agentKey, stream)
            setPlayers((previousPlayers) => [...previousPlayers, player])
        })
        peer.on('close', () => peer.destroy())
        peer.on('error', (error) => console.log('error 2: ', error))
        peersRef.current.push({ player, peer })
    }

    function toggleAudioTrack() {
        const audioTrack = streamRef.current.getTracks()[0]
        audioTrack.enabled = !audioTrackEnabled
        setAudioTrackEnabled(!audioTrackEnabled)
    }

    function toggleVideoTrack() {
        const videoTrack = streamRef.current.getTracks()[1]
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
        if (allowedTo('comment') && newComment.length) {
            // save comment
            gbgServiceRef.current!.createComment({ entryHash, text: newComment }).then(() => {
                // signal comment
                const signal: Signal = {
                    gameHash: entryHash,
                    message: {
                        type: 'NewComment',
                        content: {
                            player: playerRef.current,
                            text: newComment,
                        },
                    },
                }
                gbgServiceRef
                    .current!.notify(
                        signal,
                        peopleInRoom.map((p) => p.agentKey)
                    )
                    .then(() => setNewComment(''))
                    .catch((error) => console.log('notify error: ', error))
            })
        }
    }

    function pushComment(comment) {
        setComments((c) => [...c, comment.player ? comment : { text: comment }])
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
                    agentKey: myAgentPubKeyRef.current,
                    audio: uint8Array,
                    index: moveNumber,
                }
                const signal: Signal = {
                    gameHash: entryHash,
                    message: {
                        type: 'NewBead',
                        content: bead,
                    },
                }
                gbgServiceRef.current!.createBead({ entryHash, bead }).then(() => {
                    gbgServiceRef
                        .current!.notify(
                            signal,
                            peopleInRoomRef.current.map((p) => p.agentKey)
                        )
                        .catch((error) => console.log(error))
                })
            })
            reader.readAsArrayBuffer(blob)
        }
        mediaRecorderRef.current.start()
    }

    function signalStartGame(data) {
        const signal: Signal = {
            gameHash: entryHash,
            message: {
                type: 'StartGame',
                content: {
                    agentKey: myAgentPubKeyRef.current,
                    data: JSON.stringify(data),
                },
            },
        }
        gbgServiceRef
            .current!.notify(
                signal,
                peopleInRoom.map((p) => p.agentKey)
            )
            .catch((error) => console.log(error))
    }

    function startGame(data) {
        setGameData(data)
        setPlayers(data.players)
        setShowComments(false)
        updateShowVideos(false)
        d3.select('#timer-move-state').text('Intro')
        d3.select('#timer-seconds').text(data.introDuration)
        const firstPlayer = data.players[0]
        d3.select(`#player-${firstPlayer.agentKey}`).text('(up next)')
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

    function startMove(moveNumber, turnNumber, player, data) {
        const { numberOfTurns, moveDuration, intervalDuration } = data
        // if your move, start audio recording
        if (player.agentKey === myAgentPubKeyRef.current) startAudioRecording(moveNumber)
        // calculate turn and game duration
        const turnDuration = data.players.length * (moveDuration + intervalDuration)
        const gameDuration = turnDuration * numberOfTurns - intervalDuration
        // if first move, start game arc
        if (moveNumber === 1) startArc('game', gameDuration, colors.blue)
        // if new turn, start turn arc
        const newTurnNumber = Math.ceil(moveNumber / data.players.length)
        if (turnNumber !== newTurnNumber) {
            setTurn(newTurnNumber)
            startArc(
                'turn',
                // if final turn, remove interval duration from turn duration
                newTurnNumber === numberOfTurns ? turnDuration - intervalDuration : turnDuration,
                colors.aqua
            )
        }
        // start move arc
        startArc('move', moveDuration, colors.green)
        lowMetalTone.play()
        // update ui state
        d3.select('#timer-move-state').text('Move')
        d3.select('#timer-seconds').text(moveDuration)
        d3.selectAll(`.${styles.playerState}`).text('')
        d3.select(`#player-${player.agentKey}`).text('(recording)')
        // start seconds timer
        let timeLeft = moveDuration
        secondsTimerRef.current = setInterval(() => {
            timeLeft -= 1
            d3.select('#timer-seconds').text(timeLeft)
            if (timeLeft < 1) {
                // end seconds timer
                clearInterval(secondsTimerRef.current)
                // if your move, stop audio recording
                if (player.agentKey === myAgentPubKeyRef.current && mediaRecorderRef.current)
                    mediaRecorderRef.current.stop()
                // if more moves left
                if (moveNumber < numberOfTurns * data.players.length) {
                    // calculate next player from previous players index
                    const PPIndex = data.players.findIndex((p) => p === player)
                    const endOfTurn = PPIndex + 1 === data.players.length
                    const nextPlayer = data.players[endOfTurn ? 0 : PPIndex + 1]
                    // if interval, start interval
                    if (intervalDuration > 0)
                        startInterval(moveNumber + 1, newTurnNumber, nextPlayer, data)
                    // else start next move
                    else startMove(moveNumber + 1, newTurnNumber, nextPlayer, data)
                } else if (data.outroDuration) startOutro(data)
                else endGame()
            }
        }, 1000)
    }

    function startInterval(moveNumber, turnNumber, nextPlayer, data) {
        const { intervalDuration } = data
        // start interval timer
        startArc('move', intervalDuration, colors.yellow)
        lowMetalTone.play()
        // update ui state
        d3.select('#timer-move-state').text('Interval')
        d3.select('#timer-seconds').text(intervalDuration)
        d3.selectAll(`.${styles.playerState}`).text('')
        d3.select(`#player-${nextPlayer.agentKey}`).text('(up next)')
        // start seconds timer
        let timeLeft = intervalDuration
        secondsTimerRef.current = setInterval(() => {
            timeLeft -= 1
            d3.select('#timer-seconds').text(timeLeft)
            if (timeLeft === 0) {
                // end seconds timer and start move
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
        const signal: Signal = {
            gameHash: entryHash,
            message: {
                type: 'StopGame',
                content: {
                    agentKey: myAgentPubKeyRef.current,
                },
            },
        }
        gbgServiceRef
            .current!.notify(
                signal,
                peopleInRoom.map((p) => p.agentKey)
            )
            .catch((error) => console.log(error))
    }

    function saveGame() {
        const signalData = {
            roomId: roomIdRef.current,
            userSignaling: playerRef.current,
            gameData,
        }
        // backendShim.socket.emit('outgoing-save-game', signalData)
        backendShim.saveGame(gameData.id, beads).catch((error) => console.log(error))
    }

    function peopleInRoomText() {
        const totalUsers = peopleInRoom.length
        return `${totalUsers} ${isPlural(totalUsers) ? 'people' : 'person'} in room`
    }

    function peopleStreamingText() {
        const totalStreaming = videosRef.current.length + (userIsStreaming ? 1 : 0)
        return `${totalStreaming} ${isPlural(totalStreaming) ? 'people' : 'person'} streaming`
    }

    function addStreamToVideo(socketId, stream) {
        const video = document.getElementById(socketId) as HTMLVideoElement
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
            // unmute videos
            videosRef.current.forEach((v) => {
                const video = document.getElementById(v.socketId) as HTMLVideoElement
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
        const newSettings = { ...gameData, topicImageUrl: url, topicGroup: '' }
        gbgServiceRef.current!.updateGame({ entryHash, newSettings }).then(() => {
            const signal: Signal = {
                gameHash: entryHash,
                message: {
                    type: 'NewTopicImage',
                    content: {
                        agentKey: myAgentPubKeyRef.current,
                        topicImageUrl: url,
                    },
                },
            }
            gbgServiceRef
                .current!.notify(
                    signal,
                    peopleInRoom.map((p) => p.agentKey)
                )
                .catch((error) => console.log(error))
        })
    }

    function signalNewBackground(type, url, startTime) {
        const newSettings = {
            ...gameData,
            backgroundImage: type === 'image' ? url : '',
            backgroundVideo: type === 'video' ? url : '',
            backgroundVideoStartTime: startTime,
        }
        gbgServiceRef.current!.updateGame({ entryHash, newSettings }).then(() => {
            const signal: Signal = {
                gameHash: entryHash,
                message: {
                    type: 'NewBackground',
                    content: {
                        agentKey: myAgentPubKeyRef.current,
                        subType: type,
                        url,
                        startTime,
                    },
                },
            }
            gbgServiceRef
                .current!.notify(
                    signal,
                    peopleInRoom.map((p) => p.agentKey)
                )
                .catch((error) => console.log(error))
        })
    }

    function signalNewTopic(e) {
        e.preventDefault()
        const newSettings = { ...gameData, topic: newTopic, topicGroup: '' }
        gbgServiceRef.current!.updateGame({ entryHash, newSettings }).then(() => {
            const signal: Signal = {
                gameHash: entryHash,
                message: {
                    type: 'NewTopic',
                    content: {
                        agentKey: myAgentPubKeyRef.current,
                        topic: newTopic,
                    },
                },
            }
            gbgServiceRef
                .current!.notify(
                    signal,
                    peopleInRoom.map((p) => p.agentKey)
                )
                .then(() => setTopicTextModalOpen(false))
                .catch((error) => console.log(error))
        })
    }

    // // const history = useHistory()
    // useEffect(() => {
    //     console.log('history: ', history)
    //     const path = history.location.pathname

    //     const historyListener = history.listen((newLocation, action) => {
    //         // console.log('test')
    //         // console.log('newLocation: ', newLocation)
    //         console.log('action: ', action)
    //         if (action === 'POP') {
    //             console.log('pop')
    //             // if (path !== newLocation) {
    //             //     console.log('attempted back button')
    //             //     // Clone location object and push it to history
    //             //     history.push({
    //             //         pathname: newLocation.pathname,
    //             //         search: newLocation.search,
    //             //     })
    //             // } else {
    //             //     console.log('attempted back button 2')
    //             //     // If a "POP" action event occurs,
    //             //     // Send user back to the originating location
    //             //     history.go(1)
    //             // }
    //         }
    //         if (action === 'PUSH') {
    //             console.log('push')
    //             // if (path !== newLocation) {
    //             //     console.log('attempted back button')
    //             //     // Clone location object and push it to history
    //             //     history.push({
    //             //         pathname: newLocation.pathname,
    //             //         search: newLocation.search,
    //             //     })
    //             // } else {
    //             //     console.log('attempted back button 2')
    //             //     // If a "POP" action event occurs,
    //             //     // Send user back to the originating location
    //             //     history.go(1)
    //             // }
    //         }
    //     })
    //     return () => historyListener()
    // }, [])

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
                            .select(`#gbg-bead-${postData.id}-${liveBeadIndexRef.current}-gbg`)
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
                            .select(`#gbg-bead-${postData.id}-${liveBeadIndexRef.current}-gbg`)
                            .select('audio')
                            .node()
                        if (audio) audio.pause()
                    })
            }
        )
    }

    function addEventListenersToBead(beadIndex) {
        d3.select(`#gbg-bead-${postData.id}-${beadIndex}-gbg`)
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

    function findPlayer(agentKey) {
        return peopleInRoomRef.current.find((p) => p.agentKey === agentKey)
    }

    function signalHandler(signal) {
        const { type, content } = signal.data.payload.message
        switch (type) {
            case 'NewPlayer': {
                setPeopleInRoom((p) => [...p, content])
                peopleInRoomRef.current.push(content)
                pushComment(`${content.name} entered the room`)
                break
            }
            case 'NewComment': {
                const commentData = {
                    player: content.player,
                    text: content.text,
                    createdAt: new Date().toISOString(),
                }
                setComments((c) => [...c, commentData])
                break
            }
            case 'NewTopic': {
                const { agentKey, topic } = content
                setGameData((data) => {
                    return { ...data, topic, topicGroup: '' }
                })
                const player = findPlayer(agentKey)
                pushComment(`${player.name} updated the topic`)
                break
            }
            case 'NewTopicImage': {
                const { agentKey, topicImageUrl } = content
                setGameData((data) => {
                    return { ...data, topicImageUrl }
                })
                const player = findPlayer(agentKey)
                pushComment(`${player.name} updated the topic image`)
                break
            }
            case 'NewBackground': {
                const { agentKey, subType, url, startTime } = content
                setGameData((data) => {
                    return {
                        ...data,
                        backgroundImage: subType === 'image' ? url : '',
                        backgroundVideo: subType === 'video' ? url : '',
                        backgroundVideoStartTime: startTime,
                    }
                })
                const player = findPlayer(agentKey)
                pushComment(`${player.name} updated the background`)
                break
            }
            case 'StartGame': {
                const { agentKey, data } = content
                const parsedData = JSON.parse(data)
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
                const player = findPlayer(agentKey)
                pushComment(`${player.name} started the game`)
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
                const player = findPlayer(agentKey)
                pushComment(`${player.name} stopped the game`)
                break
            }
            case 'LeaveGame': {
                const { agentKey } = content
                const player = findPlayer(agentKey)
                pushComment(`${player.name} left the room`)
                setPeopleInRoom((ps) => {
                    return ps.filter((p) => p.agentKey !== agentKey)
                })
                peopleInRoomRef.current = peopleInRoomRef.current.filter(
                    (p) => p.agentKey !== agentKey
                )
                const peerObject = peersRef.current.find((p) => p.player.agentKey === agentKey)
                if (peerObject) {
                    peerObject.peer.destroy()
                    peersRef.current = peersRef.current.filter(
                        (p) => p.player.agentKey !== agentKey
                    )
                    videosRef.current = videosRef.current.filter(
                        (v) => v.player.agentKey !== agentKey
                    )
                }
                if (!videosRef.current.length && !streamRef.current) updateShowVideos(false)
                setPlayers((ps) => [...ps.filter((p) => p.agentKey !== agentKey)])
                break
            }
            case 'NewBead': {
                const { agentKey, audio, index } = content
                const arrayBuffer = audio.buffer.slice(
                    audio.byteOffset,
                    audio.byteLength + audio.byteOffset
                )
                const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg-3' })
                const player = findPlayer(agentKey)
                setBeads((previousBeads) => [
                    ...previousBeads,
                    {
                        user: {
                            name: agentKey === myAgentPubKeyRef.current ? 'You' : player.name,
                            flagImagePath: player.image,
                        },
                        index,
                        beadUrl: URL.createObjectURL(audioBlob),
                    },
                ])
                addEventListenersToBead(index)
                break
            }
            case 'NewSignalRequest': {
                const { player } = content
                const parsedSignal = JSON.parse(content.signal)
                // search for peer in peers array
                const existingPeer = peersRef.current.find(
                    (p) => p.player.agentKey === player.agentKey
                )
                // if peer exists, pass signal to peer
                if (existingPeer) existingPeer.peer.signal(parsedSignal)
                else {
                    // otherwise, create new peer connection (with stream if running)
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
                                    player: playerRef.current,
                                    signal: JSON.stringify(data),
                                },
                            },
                        }
                        gbgServiceRef
                            .current!.notify(signalResponse, [player.agentKey])
                            .catch((error) => console.log('notify error: ', error))
                    })
                    peer.on('stream', (stream) => {
                        videosRef.current.push({
                            player,
                            peer,
                            audioOnly: !stream.getVideoTracks().length,
                        })
                        pushComment(`${player.name}'s video connected`)
                        addStreamToVideo(player.agentKey, stream)
                        setPlayers((previousPlayers) => [...previousPlayers, player])
                    })
                    peer.on('close', () => peer.destroy())
                    peer.on('error', (error) => console.log('error 2: ', error))
                    peer.signal(parsedSignal)
                    peersRef.current.push({ player, peer })
                }
                break
            }
            case 'NewSignalResponse': {
                const { player } = content
                const parsedSignal = JSON.parse(content.signal)
                const peerObject = peersRef.current.find(
                    (p) => p.player.agentKey === player.agentKey
                )
                if (peerObject) {
                    if (peerObject.peer.readable) peerObject.peer.signal(parsedSignal)
                    else {
                        peerObject.peer.destroy()
                        peersRef.current = peersRef.current.filter(
                            (p) => p.player.agentKey !== player.agentKey
                        )
                    }
                }
                break
            }
            case 'RefreshRequest': {
                const { agentKey } = content
                const peerObject = peersRef.current.find((p) => p.player.agentKey === agentKey)
                if (peerObject) {
                    peerObject.peer.destroy()
                    peersRef.current = peersRef.current.filter(
                        (p) => p.player.agentKey !== agentKey
                    )
                    videosRef.current = videosRef.current.filter(
                        (v) => v.player.agentKey !== agentKey
                    )
                    setPlayers((ps) => [...ps.filter((p) => p.agentKey !== agentKey)])
                }
                break
            }
            case 'StreamDisconnected': {
                const { agentKey } = content
                videosRef.current = videosRef.current.filter((v) => v.player.agentKey !== agentKey)
                if (!videosRef.current.length && !streamRef.current) updateShowVideos(false)
                setPlayers((ps) => [...ps.filter((p) => p.agentKey !== agentKey)])
                if (agentKey !== myAgentPubKeyRef.current) {
                    const player = findPlayer(agentKey)
                    pushComment(`${player.name}'s stream disconnected`)
                }
                break
            }
            default:
                break
        }
    }

    async function initialiseGBGService() {
        const client = await AppWebsocket.connect(`ws://localhost:${process.env.REACT_APP_HC_PORT}`)
        const appInfo = await client.appInfo({ installed_app_id: 'glassbeadgame' })
        const holochainClient = new HolochainClient(client)
        const cellData = appInfo.cell_data.find(
            (c: InstalledCell) => c.role_name === 'glassbeadgame-role'
        )
        if (!cellData) throw new Error('No cell with glassbeadgame-role role id was found')
        const cellClient = new CellClient(holochainClient, cellData)
        gbgServiceRef.current = new GlassBeadGameService(cellClient)
        cellClient.addSignalHandler(signalHandler)
    }

    async function initialiseGame() {
        myAgentPubKeyRef.current = await gbgServiceRef.current!.myAgentPubKey
        playerRef.current = await gbgServiceRef.current!.getPlayerDetails(myAgentPubKeyRef.current)
        const { settings: game } = await gbgServiceRef.current!.getGame(entryHash)
        const playersArray = await gbgServiceRef.current!.getPlayers(entryHash)
        const gameComments = await gbgServiceRef.current!.getComments(entryHash)
        const gameBeads = await gbgServiceRef.current!.getBeads(entryHash)
        setGameData(game)
        setPeopleInRoom(playersArray)
        peopleInRoomRef.current = playersArray
        setComments(gameComments)
        // handle beads
        if (gameBeads.length) {
            setGameData((d) => {
                return { ...d, locked: true }
            })
            setBeads(
                gameBeads.map((b) => {
                    const { player, bead } = b
                    const { audio, index, agentKey } = bead
                    const arrayBuffer = audio.buffer.slice(
                        audio.byteOffset,
                        audio.byteLength + audio.byteOffset
                    )
                    const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg-3' })
                    return {
                        user: {
                            name: agentKey === myAgentPubKeyRef.current ? 'You' : player.name,
                            flagImagePath: player.image,
                        },
                        index,
                        beadUrl: URL.createObjectURL(audioBlob),
                    }
                })
            )
        }
        // connect to peers
        playersArray
            .filter((p) => p.agentKey !== myAgentPubKeyRef.current)
            .forEach((player) => {
                // remove old peer if present
                const peerObject = peersRef.current.find(
                    (p) => p.player.agentKey === player.agentKey
                )
                if (peerObject) {
                    peerObject.peer.destroy()
                    peersRef.current = peersRef.current.filter(
                        (p) => p.player.agentKey !== player.agentKey
                    )
                    videosRef.current = videosRef.current.filter(
                        (v) => v.player.agentKey !== player.agentKey
                    )
                }
                // create peer connection
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
                                player: playerRef.current,
                                signal: JSON.stringify(data),
                            },
                        },
                    }
                    gbgServiceRef
                        .current!.notify(signal, [player.agentKey])
                        .catch((error) => console.log('notify error: ', error))
                })
                peer.on('stream', (stream) => {
                    videosRef.current.push({
                        player,
                        peer,
                        audioOnly: !stream.getVideoTracks().length,
                    })
                    pushComment(`${player.name}'s video connected`)
                    addStreamToVideo(player.agentKey, stream)
                    setPlayers((previousPlayers) => [...previousPlayers, player])
                })
                peer.on('close', () => peer.destroy())
                peer.on('error', (error) => console.log(error))
                peersRef.current.push({ player, peer })
            })
        // if new to game, join game and notify other platers
        const playerInRoom = playersArray.find((p) => p.agentKey === myAgentPubKeyRef.current)
        if (playerInRoom) joinGameHash.current = playerInRoom[1]
        else {
            gbgServiceRef
                .current!.joinGame({ agentKey: myAgentPubKeyRef.current, entryHash })
                .then((res) => {
                    joinGameHash.current = res
                    setPeopleInRoom((p) => [...p, playerRef.current])
                    peopleInRoomRef.current.push(playerRef.current)
                })
        }
        if (playersArray.length > 0) {
            const signal: Signal = {
                gameHash: entryHash,
                message: {
                    type: 'NewPlayer',
                    content: playerRef.current,
                },
            }
            gbgServiceRef
                .current!.notify(
                    signal,
                    playersArray.map((p: any) => p.agentKey)
                )
                .catch((error) => console.log('notify error: ', error))
        }
    }

    async function leaveGame() {
        if (gbgServiceRef.current && joinGameHash.current) {
            const otherPlayers = peopleInRoomRef.current
                .filter((p) => p.agentKey !== myAgentPubKeyRef.current)
                .map((p) => p.agentKey)
            const signal: Signal = {
                gameHash: entryHash,
                message: {
                    type: 'LeaveGame',
                    content: {
                        agentKey: myAgentPubKeyRef.current,
                    },
                },
            }
            gbgServiceRef
                .current!.notify(signal, otherPlayers)
                .then(() => {
                    gbgServiceRef
                        .current!.leaveGame(joinGameHash.current)
                        .catch((error) => console.log(error))
                })
                .catch((error) => console.log(error))
        }
    }

    useEffect(() => {
        initialiseGBGService()
    }, [])

    useEffect(() => {
        if (gbgServiceRef.current) initialiseGame()
        return () => {
            leaveGame()
        }
    }, [gbgServiceRef.current])

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

        // fade out loading animation
        setTimeout(() => {
            const loadingAnimation = d3.select('#loading-animation')
            if (loadingAnimation) loadingAnimation.style('opacity', 0)
            setTimeout(() => {
                setShowLoadingAnimation(false)
                if (largeScreen) setShowComments(true)
            }, 1000)
        }, loadingAnimationDuration)

        // set up timer canvas
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

        // order is important here to ensure correct layering
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
                    id={gameData.id}
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
                                key={uuidv4()}
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
                                <Row centerY key={player.agentKey} className={styles.player}>
                                    <div className={styles.position}>{index + 1}</div>
                                    <ImageTitle
                                        type='user'
                                        imagePath={player.image}
                                        title={
                                            player.agentKey === myAgentPubKeyRef.current
                                                ? 'You'
                                                : player.name
                                        }
                                        fontSize={largeScreen ? 16 : 10}
                                        imageSize={largeScreen ? 35 : 20}
                                        style={{ marginRight: largeScreen ? 10 : 5 }}
                                    />
                                    <p
                                        id={`player-${player.agentKey}`}
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
                                <>
                                    {/* {userIsStreaming && ( */}
                                    <Button
                                        // text={`${beads.length ? 'Restart' : 'Start'} game`}
                                        text='Start game'
                                        color={beads.length ? 'red' : 'blue'}
                                        size={largeScreen ? 'large' : 'small'}
                                        style={{ marginBottom: 10 }}
                                        onClick={() =>
                                            allowedTo('start-game') &&
                                            setGameSettingsModalOpen(true)
                                        }
                                    />
                                    {/* )} */}
                                    {/* {beads.length > 0 && (
                                        <Button
                                            text='Save game'
                                            color='blue'
                                            size={largeScreen ? 'large' : 'small'}
                                            style={{ marginBottom: 10 }}
                                            onClick={() => allowedTo('save-game') && saveGame()}
                                        />
                                    )} */}
                                </>
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
                    {gameSettingsModalOpen && (
                        <GameSettingsModal
                            close={() => setGameSettingsModalOpen(false)}
                            gameData={gameData}
                            player={playerRef.current}
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
                            <Button
                                text={`${userIsStreaming ? 'Stop' : 'Start'} streaming`}
                                color={userIsStreaming ? 'red' : 'aqua'}
                                style={{ marginBottom: 10, alignSelf: 'flex-start' }}
                                loading={loadingStream}
                                disabled={loadingStream}
                                onClick={() => allowedTo('stream') && toggleStream()}
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
                                        {userIsStreaming && (
                                            <ImageTitle
                                                type='user'
                                                imagePath={playerRef.current.image}
                                                title='You'
                                                fontSize={16}
                                                imageSize={40}
                                                style={{ marginBottom: 10 }}
                                            />
                                        )}
                                        {videosRef.current.map((v) => (
                                            <ImageTitle
                                                key={v.player.agentKey}
                                                type='user'
                                                imagePath={v.player.image}
                                                title={v.player.name}
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
                                {peopleInRoom.map((player) => (
                                    <ImageTitle
                                        key={player.agentKey}
                                        type='user'
                                        imagePath={player.image}
                                        title={
                                            player.agentKey === myAgentPubKeyRef.current
                                                ? 'You'
                                                : player.name
                                        }
                                        fontSize={16}
                                        imageSize={40}
                                        style={{ marginBottom: 10 }}
                                    />
                                ))}
                                {/* {usersRef.current.map((user) => (
                                    <ImageTitle
                                        key={user.socketId}
                                        type='user'
                                        imagePath={user.userData.flagImagePath}
                                        title={isYou(user.socketId) ? 'You' : user.userData.name}
                                        fontSize={16}
                                        imageSize={40}
                                        style={{ marginBottom: 10 }}
                                    />
                                ))} */}
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
                        <Button
                            text={`${userIsStreaming ? 'Stop' : 'Start'} streaming`}
                            color={userIsStreaming ? 'red' : 'aqua'}
                            style={{ marginBottom: 10, alignSelf: 'flex-start' }}
                            loading={loadingStream}
                            disabled={loadingStream}
                            onClick={() => allowedTo('stream') && toggleStream()}
                        />
                    )}
                    {userIsStreaming && (
                        <Video
                            id='your-video'
                            user={playerRef.current}
                            size={findVideoSize()}
                            audioEnabled={audioTrackEnabled}
                            videoEnabled={videoTrackEnabled}
                            toggleAudio={toggleAudioTrack}
                            toggleVideo={toggleVideoTrack}
                            audioOnly={audioOnly}
                        />
                    )}
                    {videosRef.current.map((v) => {
                        return (
                            <Video
                                key={v.player.agentKey}
                                id={v.player.agentKey}
                                user={v.player}
                                size={findVideoSize()}
                                audioOnly={v.audioOnly}
                                refreshStream={refreshStream}
                            />
                        )
                    })}
                </Scrollbars>
            </Row>
            <Scrollbars
                className={`${styles.beads} ${!beads.length && styles.hidden} ${
                    (gameData.backgroundImage || gameData.backgroundVideo) && styles.transparent
                } row`}
            >
                {beads.map((bead, beadIndex) => (
                    <Row
                        centerY
                        key={`${bead.roomId}${bead.index}`}
                        style={{ paddingRight: beads.length === beadIndex + 1 ? 20 : 0 }}
                    >
                        <BeadCard
                            postId={postData.id}
                            location='gbg'
                            bead={bead}
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

// peer.on('iceStateChange', (iceConnectionState, iceGatheringState) => {
//     console.log('ice', iceConnectionState, iceGatheringState)
// })

// peer._debug = console.log
