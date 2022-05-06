import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import styles from '@styles/pages/GamesPage.module.scss'
import Column from '@components/Column'
import Row from '@components/Row'
import Button from '@components/Button'

const sampleGames = [
    {
        id: 1,
        topic: 'Topic 1',
        introDuration: 10,
        numberOfTurns: 5,
        moveDuration: 30,
        intervalDuration: 0,
        outroDuration: 30
    },
    {
        id: 2,
        topic: 'Topic 2',
        introDuration: 10,
        numberOfTurns: 5,
        moveDuration: 30,
        intervalDuration: 0,
        outroDuration: 30
    },
    {
        id: 3,
        topic: 'Topic 3',
        introDuration: 10,
        numberOfTurns: 5,
        moveDuration: 30,
        intervalDuration: 0,
        outroDuration: 30
    }
]

const GamesPage = (): JSX.Element => {
    const [games, setGames] = useState<any[]>(sampleGames)
    const history = useHistory()

    useEffect(() => {
        console.log('Get games!')
        // backendShim
        //     .getGames()
        //     .then((games) => setGames(games))
        //     .catch((error) => console.log(error))
    }, [])

    return (
        <Column centerX centerY className={styles.wrapper}>
            {games.map((game) => (
                <Row key={game.id} spaceBetween className={styles.game}>
                    <Column>
                        <p>Id: {game.id}</p>
                        <p>Topic: {game.topic}</p>
                    </Column>
                    <Button color='blue' text='Open game' onClick={() => history.push(`/game/${game.id}`)} />
                </Row>
            ))}
        </Column>
    )
}

export default GamesPage
