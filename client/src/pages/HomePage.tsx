import React, { useState } from 'react'
import styles from '@styles/pages/HomePage.module.scss'
import { defaultErrorState, allValid } from '@src/Helpers'
import Column from '@components/Column'
import Row from '@components/Row'
import Button from '@components/Button'
import Modal from '@components/Modal'
import Input from '@components/Input'
import LoadingWheel from '@components/LoadingWheel'
import SuccessMessage from '@components/SuccessMessage'

const Homepage = (): JSX.Element => {
    const [createGameModalOpen, setCreateGameModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        topic: {
            value: '',
            validate: (v) => {
                const errors: string[] = []
                if (!v) errors.push('Required')
                if (v.length > 500) errors.push('Must be less than 500 characters')
                return errors
            },
            ...defaultErrorState,
        },
        introDuration: {
            value: 0,
            validate: (v) => (v < 10 || v > 300 ? ['Must be between 10 seconds and 5 mins'] : []),
            ...defaultErrorState,
        },
        numberOfTurns: {
            value: 0,
            validate: (v) => (v < 1 || v > 20 ? ['Must be between 1 and 20 turns'] : []),
            ...defaultErrorState,
        },
        moveDuration: {
            value: 0,
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
    const { topic, introDuration, numberOfTurns, moveDuration, intervalDuration, outroDuration } = formData

    function updateValue(name, value) {
        setFormData({ ...formData, [name]: { ...formData[name], value, state: 'default' } })
    }

    function saveGame(e) {
        e.preventDefault()
        if (allValid(formData, setFormData)) {
            setLoading(true)
            const data = {
                locked: true,
                topic: topic.value,
                numberOfTurns: numberOfTurns.value,
                moveDuration: moveDuration.value,
                introDuration: introDuration.value,
                intervalDuration: intervalDuration.value,
                outroDuration: outroDuration.value,
            }
            console.log('Save game data in backend: ', data)
            
            // backendShim
            //     .saveGameSettings(data)
            //     .then(() => {
            //         setLoading(false)
            //         setSaved(true)
            //         close()
            //     })
            //     .catch((error) => console.log(error))
        }
    }

    return (
        <Column centerX centerY className={styles.wrapper}>
            <Button color='blue' text='Create game' onClick={() => setCreateGameModalOpen(true)} />
            {createGameModalOpen && (
                <Modal centered close={() => setCreateGameModalOpen(false)}>
                    <h1>Create a new Glass Bead Game</h1>
                    <form onSubmit={saveGame}>
                        <Column style={{ marginBottom: 20 }}>
                            <Input
                                title='Topic'
                                type='text'
                                style={{ marginBottom: 10 }}
                                disabled={loading || saved}
                                state={topic.state}
                                errors={topic.errors}
                                value={topic.value}
                                onChange={(v) => updateValue('topic', v)}
                            />
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
                            <Input
                                title='Outro duration (seconds)'
                                type='text'
                                style={{ marginBottom: 10 }}
                                disabled={loading || saved}
                                state={outroDuration.state}
                                errors={outroDuration.errors}
                                value={outroDuration.value}
                                onChange={(v) => updateValue('outroDuration', +v.replace(/\D/g, ''))}
                            />
                        </Column>
                        <Row>
                            {!saved && (
                                <Button text='Create game' color='blue' disabled={loading || saved} submit />
                            )}
                            {loading && <LoadingWheel />}
                            {saved && <SuccessMessage text='Saved' />}
                        </Row>
                    </form>
                </Modal>
            )}
        </Column>
    )
}

export default Homepage
