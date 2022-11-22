/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react'
import GlassBeadGameService from '@src/glassbeadgame.service'
import { defaultErrorState, allValid } from '@src/Helpers'
import GlassBeadGameTopics from '@src/GlassBeadGameTopics'
import styles from '@styles/components/modals/CreateGameModal.module.scss'
import Column from '@components/Column'
import Row from '@components/Row'
import Button from '@components/Button'
import Modal from '@components/Modal'
import Input from '@components/Input'
import ProgressBarSteps from '@components/ProgressBarSteps'
// import LoadingWheel from '@components/LoadingWheel'
import SuccessMessage from '@components/SuccessMessage'
// import { Signal } from '@src/GameTypes'
import Scrollbars from '../Scrollbars'

const CreateGameModal = (props: {
    gbgService: null | GlassBeadGameService
    games: any[]
    setGames: (games: any[]) => void
    close: () => void
}): JSX.Element => {
    const { gbgService, games, setGames, close } = props
    const steps = ['Topic', 'Description', 'Settings']
    const [currentStep, setCurrentStep] = useState(1)
    const [topicGroup, setTopicGroup] = useState('archetopics')
    const [topic, setTopic] = useState('')
    const [topicError, setTopicError] = useState(false)

    const [descriptionForm, setDescriptionForm] = useState({
        description: {
            value: '',
            validate: (v) => (v.length > 5000 ? ['Must be less than 5K characters'] : []),
            ...defaultErrorState,
        },
    })

    const [settingsForm, setSettingsForm] = useState({
        introDuration: {
            value: 10,
            validate: (v) => (v < 10 || v > 300 ? ['Must be between 10 seconds and 5 mins'] : []),
            ...defaultErrorState,
        },
        numberOfTurns: {
            value: 3,
            validate: (v) => (v < 1 || v > 20 ? ['Must be between 1 and 20 turns'] : []),
            ...defaultErrorState,
        },
        moveDuration: {
            value: 10,
            validate: (v) => (v < 10 || v > 600 ? ['Must be between 10 seconds and 10 mins'] : []),
            ...defaultErrorState,
        },
        intervalDuration: {
            value: 0,
            validate: (v) => (v > 60 ? ['Must be 60 seconds or less'] : []),
            ...defaultErrorState,
        },
        outroDuration: {
            value: 0,
            validate: (v) => (v > 300 ? ['Must be 5 minutes or less'] : []),
            ...defaultErrorState,
        },
    })

    const [loading, setLoading] = useState(false)
    const [saved, setSaved] = useState(false)
    const { introDuration, numberOfTurns, moveDuration, intervalDuration, outroDuration } =
        settingsForm

    function moveForward() {
        if (currentStep === 1) {
            if (!topic) setTopicError(true)
            else setCurrentStep(2)
        }
        if (currentStep === 2 && allValid(descriptionForm, setDescriptionForm)) setCurrentStep(3)
    }

    function updateValue(name, value) {
        setSettingsForm({
            ...settingsForm,
            [name]: { ...settingsForm[name], value, state: 'default' },
        })
    }

    function createGame() {
        if (gbgService && allValid(settingsForm, setSettingsForm)) {
            setLoading(true)
            const gameData = {
                locked: false,
                topic,
                topicGroup,
                topicImageUrl:
                    topicGroup === 'custom'
                        ? ''
                        : GlassBeadGameTopics[topicGroup].find((item) => item.name === topic)
                              .imagePath,
                description: descriptionForm.description.value,
                backgroundImage: '',
                backgroundVideo: '',
                backgroundVideoStartTime: 0,
                numberOfTurns: numberOfTurns.value,
                moveDuration: moveDuration.value,
                introDuration: introDuration.value,
                intervalDuration: intervalDuration.value,
                outroDuration: outroDuration.value,
            }
            gbgService
                .createGame(gameData)
                .then((res) => {
                    setLoading(false)
                    setSaved(true)
                    setGames([...games, { settings: gameData, entryHash: res.entryHash }])
                    // const signal: Signal = {
                    //     gameHash: '',
                    //     message: {
                    //         type: 'NewGame',
                    //         content: { game: gameData },
                    //     },
                    // }
                    // const players = await gbgService.getPlayers('')
                    // console.log('players: ', players)
                    // gbgService.notify(
                    //     signal,
                    //     players.map((p) => p[0])
                    // )
                    setTimeout(() => close(), 1000)
                })
                .catch((error) => console.log(error))
        }
    }

    return (
        <Modal centered close={close}>
            {saved ? (
                <SuccessMessage text='Game saved!' />
            ) : (
                <Column centerX style={{ width: 500 }}>
                    <h1>Create Game</h1>
                    {currentStep === 1 && (
                        <Column centerX>
                            <p>Choose a topic:</p>
                            <Row style={{ margin: '20px 0' }}>
                                <Button
                                    text='Archetopics'
                                    color={topicGroup === 'archetopics' ? 'blue' : 'grey'}
                                    onClick={() => {
                                        setTopic('')
                                        setTopicError(false)
                                        setTopicGroup('archetopics')
                                    }}
                                    style={{ marginRight: 10 }}
                                />
                                <Button
                                    text='Liminal'
                                    color={topicGroup === 'liminal' ? 'blue' : 'grey'}
                                    onClick={() => {
                                        setTopic('')
                                        setTopicError(false)
                                        setTopicGroup('liminal')
                                    }}
                                    style={{ marginRight: 10 }}
                                />
                                <Button
                                    text='Custom'
                                    color={topicGroup === 'custom' ? 'blue' : 'grey'}
                                    onClick={() => {
                                        setTopic('')
                                        setTopicError(false)
                                        setTopicGroup('custom')
                                    }}
                                />
                            </Row>
                            {topicGroup === 'custom' ? (
                                <Input
                                    type='text'
                                    placeholder='Add a custom topic...'
                                    value={topic}
                                    onChange={(value) => {
                                        setTopicError(false)
                                        setTopic(value)
                                    }}
                                />
                            ) : (
                                <Column style={{ width: 500, height: 280 }}>
                                    <Scrollbars>
                                        <Row wrap centerX>
                                            {GlassBeadGameTopics[topicGroup].map((t) => (
                                                <button
                                                    key={t.name}
                                                    type='button'
                                                    className={`${styles.topicButton} ${
                                                        topic === t.name && styles.selected
                                                    }`}
                                                    onClick={() => {
                                                        setTopicError(false)
                                                        setTopic(t.name)
                                                    }}
                                                >
                                                    <div>
                                                        <img src={t.imagePath} alt='' />
                                                    </div>
                                                    <p>{t.name}</p>
                                                </button>
                                            ))}
                                        </Row>
                                    </Scrollbars>
                                </Column>
                            )}
                            {topicError && (
                                <p className='danger' style={{ marginTop: 20 }}>
                                    No topic selected
                                </p>
                            )}
                        </Column>
                    )}

                    {currentStep === 2 && (
                        <Column centerX>
                            <p>Choose a description for the game:</p>
                            <Input
                                type='text-area'
                                rows={5}
                                placeholder='Add a description (optional)...'
                                value={descriptionForm.description.value}
                                state={descriptionForm.description.state}
                                errors={descriptionForm.description.errors}
                                onChange={(value) => {
                                    setDescriptionForm({
                                        description: {
                                            ...descriptionForm.description,
                                            value,
                                            state: 'default',
                                        },
                                    })
                                }}
                                style={{ width: 400, marginTop: 30 }}
                            />
                        </Column>
                    )}

                    {currentStep === 3 && (
                        <Column>
                            <p style={{ marginBottom: 30 }}>Choose the game settings:</p>
                            <Input
                                title='Intro duration (seconds)'
                                type='text'
                                style={{ marginBottom: 10 }}
                                disabled={loading || saved}
                                state={introDuration.state}
                                errors={introDuration.errors}
                                value={introDuration.value}
                                onChange={(v) =>
                                    updateValue('introDuration', +v.replace(/\D/g, ''))
                                }
                            />
                            <Input
                                title='Number of turns'
                                type='text'
                                style={{ marginBottom: 10 }}
                                disabled={loading || saved}
                                state={numberOfTurns.state}
                                errors={numberOfTurns.errors}
                                value={numberOfTurns.value}
                                onChange={(v) =>
                                    updateValue('numberOfTurns', +v.replace(/\D/g, ''))
                                }
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
                                onChange={(v) =>
                                    updateValue('intervalDuration', +v.replace(/\D/g, ''))
                                }
                            />
                            <Input
                                title='Outro duration (seconds)'
                                type='text'
                                style={{ marginBottom: 10 }}
                                disabled={loading || saved}
                                state={outroDuration.state}
                                errors={outroDuration.errors}
                                value={outroDuration.value}
                                onChange={(v) =>
                                    updateValue('outroDuration', +v.replace(/\D/g, ''))
                                }
                            />
                        </Column>
                    )}

                    <Row style={{ margin: '40px 0' }}>
                        {currentStep > 1 && (
                            <Button
                                text='Back'
                                color='purple'
                                disabled={loading}
                                onClick={() => setCurrentStep(currentStep - 1)}
                                style={{ marginRight: 10 }}
                            />
                        )}
                        {currentStep < steps.length && (
                            <Button
                                text='Next'
                                color='blue'
                                disabled={loading}
                                onClick={moveForward}
                            />
                        )}
                        {currentStep === steps.length && (
                            <Button
                                text='Create game'
                                color='blue'
                                disabled={loading}
                                loading={loading}
                                onClick={createGame}
                            />
                        )}
                    </Row>
                    <ProgressBarSteps steps={steps} currentStep={currentStep} />
                </Column>
            )}
        </Modal>
    )
}

export default CreateGameModal
