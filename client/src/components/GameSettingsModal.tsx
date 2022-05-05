import {useState, FC, FormEvent} from 'react'

import Modal from './Modal'
import Row from './Row'
import Column from './Column'
import Button from './Button'
import LoadingWheel from './LoadingWheel'
import SuccessMessage from './SuccessMessage'
import Input from './Input'
import ImageTitle from './ImageTitle'

import { ReactComponent as ChevronUpIconSVG } from '../svgs/chevron-up-solid.svg'
import { ReactComponent as ChevronDownIconSVG } from '../svgs/chevron-down-solid.svg'

import styles from '../styles/components/GlassBeadGame.module.scss'

import {
    notNull,
    allValid,
    defaultErrorState,
} from '../helpers/util'

interface GameSetting {
    gameId: number | null;
    topic: string | null;
    locked: boolean;
    introDuration: number;
    numberOfTurns: number;
    moveDuration: number;
    intervalDuration: number;
}

const gameDefaults: GameSetting = {
    gameId: null,
    topic: null,
    locked: true,
    introDuration: 30,
    numberOfTurns: 3,
    moveDuration: 60,
    intervalDuration: 0,
}

interface GameSettingsModalProps {
    close: any;
    gameData: GameSetting;
    socketId: any;
    players: any[];
    setPlayers: Function;
    signalStartGame: Function;
}



const GameSettingsModal: FC<GameSettingsModalProps> = (props) => {
    const { close, gameData, socketId, players, setPlayers, signalStartGame } = props

    const [formData, setFormData] = useState({
        introDuration: {
            value: notNull(gameData.introDuration) || gameDefaults.introDuration,
            validate: (v: number) => (v < 10 || v > 60 ? ['Must be between 10 and 60 seconds'] : []),
            ...defaultErrorState,
        },
        numberOfTurns: {
            value: notNull(gameData.numberOfTurns) || gameDefaults.numberOfTurns,
            validate: (v: number) => (v < 1 || v > 20 ? ['Must be between 1 and 20 turns'] : []),
            ...defaultErrorState,
        },
        moveDuration: {
            value: notNull(gameData.moveDuration) || gameDefaults.moveDuration,
            validate: (v: number) => (v < 10 || v > 600 ? ['Must be between 10 seconds and 10 mins'] : []),
            ...defaultErrorState,
        },
        intervalDuration: {
            value: notNull(gameData.intervalDuration) || gameDefaults.intervalDuration,
            validate: (v: number) => (v > 60 ? ['Must be 60 seconds or less'] : []),
            ...defaultErrorState,
        },
    })
    const { introDuration, numberOfTurns, moveDuration, intervalDuration } = formData
    const [playersError, setPlayersError] = useState('')
    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)

    function updateValue(name: 'introDuration' | 'numberOfTurns' | 'moveDuration' | 'intervalDuration', value: any) {
        setFormData({ ...formData, [name]: { ...formData[name], value, state: 'default' } })
    }

    function updatePlayerPosition(from: number, to: number) {
        const newPlayers = [...players]
        const player = newPlayers[from]
        newPlayers.splice(from, 1)
        newPlayers.splice(to, 0, player)
        setPlayers(newPlayers)
    }

    function saveSettings(e: FormEvent) {
        e.preventDefault()
        setPlayersError(players.length ? '' : 'At least one player must connect their audio/video')
        if (allValid(formData, setFormData) && players.length) {
            setLoading(true)
            const dbData = {
                gameId: gameData.gameId,
                numberOfTurns: numberOfTurns.value,
                moveDuration: moveDuration.value,
                introDuration: introDuration.value,
                intervalDuration: intervalDuration.value,
                playerOrder: players.map((p) => p.id).join(','),
            }
            // Save into LocalStorage
            localStorage.setItem('GAME_CONFIG', JSON.stringify(dbData))
            // axios
            //     .post(`${config.apiURL}/save-glass-bead-game-settings`, dbData)
            //     .then(() => {
                    setLoading(false)
                    setSaved(true)
                    signalStartGame({
                        ...gameData,
                        numberOfTurns: numberOfTurns.value,
                        moveDuration: moveDuration.value,
                        introDuration: introDuration.value,
                        intervalDuration: intervalDuration.value,
                        players,
                    })
                    close()
            // })
            // .catch((error) => console.log(error))
        }
    }

    return (
        <Modal close={close} centered>
            <h1>Game settings</h1>
            <p>Players must connect their audio/video to participate in the game</p>
            <form onSubmit={saveSettings}>
                <Row style={{ margin: '10px 0 30px 0' }}>
                    <Column style={{ marginRight: 60 }}>
                        <Input
                            title='Intro duration (seconds)'
                            type='text'
                            style={{ marginBottom: 10 }}
                            disabled={loading || saved}
                            state={introDuration.state}
                            errors={introDuration.errors}
                            value={introDuration.value}
                            onChange={(v) => updateValue('introDuration', +v.replace(/\D/g, ''))}
                        />
                        <Input
                            title='Number of turns'
                            type='text'
                            style={{ marginBottom: 10 }}
                            disabled={loading || saved}
                            state={numberOfTurns.state}
                            errors={numberOfTurns.errors}
                            value={numberOfTurns.value}
                            onChange={(v) => updateValue('numberOfTurns', +v.replace(/\D/g, ''))}
                        />
                        <Input
                            title='Move duration (seconds)'
                            type='text'
                            style={{ marginBottom: 10 }}
                            disabled={loading || saved}
                            state={moveDuration.state}
                            errors={moveDuration.errors}
                            value={moveDuration.value}
                            onChange={(v) => updateValue('moveDuration', +v.replace(/\D/g, ''))}
                        />
                        <Input
                            title='Interval duration (seconds)'
                            type='text'
                            style={{ marginBottom: 10 }}
                            disabled={loading || saved}
                            state={intervalDuration.state}
                            errors={intervalDuration.errors}
                            value={intervalDuration.value}
                            onChange={(v) => updateValue('intervalDuration', +v.replace(/\D/g, ''))}
                        />
                    </Column>
                    <Column style={{ width: 250 }}>
                        <h2 style={{ margin: 0 }}>Player order</h2>
                        {players.map((player, i) => (
                            <Row style={{ marginTop: 10 }} key={i}>
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
                                    imagePath={player.flagImagePath}
                                    title={player.socketId === socketId ? 'You' : player.name}
                                    fontSize={16}
                                    imageSize={35}
                                />
                            </Row>
                        ))}
                        {!players.length && <p className={styles.grey}>No users connected...</p>}
                        {!!playersError.length && <p className={styles.red}>{playersError}</p>}
                    </Column>
                </Row>
                <Row>
                    {!saved && (
                        <Button
                            text='Start game'
                            color='blue'
                            disabled={loading || saved}
                            submit
                        />
                    )}
                    {loading && <LoadingWheel />}
                    {saved && <SuccessMessage text='Saved' />}
                </Row>
            </form>
        </Modal>
    )
}

export default GameSettingsModal;
