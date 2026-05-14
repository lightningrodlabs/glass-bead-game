/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useContext, useState } from 'react'
import { defaultErrorState, allValid } from '@src/Helpers'
import GlassBeadGameTopics from '@src/GlassBeadGameTopics'
import styles from '@styles/components/modals/CreateGameModal.module.scss'
import Column from '@components/Column'
import Row from '@components/Row'
import Button from '@components/Button'
import Modal from '@components/Modal'
import Input from '@components/Input'
import ProgressBarSteps from '@components/ProgressBarSteps'
import SuccessMessage from '@components/SuccessMessage'
import Scrollbars from '../Scrollbars'
import { AppContext } from '@src/contexts'
import type { GameOutput } from '@src/GameTypes'

const CreateGameModal = (props: {
    games: GameOutput[]
    setGames: (games: GameOutput[]) => void
    close: () => void
}): JSX.Element => {
    const { games, setGames, close } = props
    const ctx = useContext(AppContext)!
    const { service } = ctx
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
        if (allValid(settingsForm, setSettingsForm)) {
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
            service
                .createGame(gameData)
                .then((res) => {
                    setLoading(false)
                    setSaved(true)
                    setGames([
                        ...games,
                        {
                            creator: service.myAgentPubKey,
                            created: Date.now() * 1000,
                            settings: gameData,
                            entryHash: res.entryHash,
                        },
                    ])
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
        <Modal centered closeOnClickOutside={false} close={close}>
            {saved ? (
                <SuccessMessage text='Game saved!' />
            ) : (
                <Column style={{ width: 500 }}>
                    <h1 style={{ alignSelf: 'center' }}>Create Game</h1>
                    {currentStep === 1 && (
                        <Column>
                            <p style={{ alignSelf: 'center' }}>Choose a topic:</p>
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
                                    style={{ width: '100%' }}
                                />
                            ) : (
                                <Column style={{ width: '100%', height: 280 }}>
                                    <Scrollbars>
                                        <Row wrap style={{ justifyContent: 'space-around' }}>
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
                        <Column>
                            <p style={{ alignSelf: 'center' }}>Choose a description for the game:</p>
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
                                style={{ width: '100%', marginTop: 30 }}
                            />
                        </Column>
                    )}

                    {currentStep === 3 && (
                        <Column>
                            <p style={{ marginBottom: 20, alignSelf: 'center' }}>Choose the game&apos;s settings:</p>
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
                                    description:
                                        'Total moves = turns × players.',
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
                                        onChange={(v) =>
                                            updateValue(name, +v.replace(/\D/g, ''))
                                        }
                                    />
                                    <Column className={styles.settingText}>
                                        <h3>{label}</h3>
                                        <p>{description}</p>
                                    </Column>
                                </Row>
                            ))}
                        </Column>
                    )}

                    <Row style={{ margin: '40px 0', alignSelf: 'center' }}>
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
                    <div style={{ alignSelf: 'center', width: 400 }}>
                        <ProgressBarSteps steps={steps} currentStep={currentStep} />
                    </div>
                </Column>
            )}
        </Modal>
    )
}

export default CreateGameModal
