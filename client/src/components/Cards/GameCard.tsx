import React from 'react'
import { useHistory } from 'react-router-dom'
import styles from '@styles/components/cards/GameCard.module.scss'
import Column from '@src/components/Column'
import Row from '@src/components/Row'
import Button from '@components/Button'
import FlagImage from '@src/components/FlagImage'

const GameCard = (props: { game: any }): JSX.Element => {
    const { game } = props
    const { creator, settings, entryHash } = game
    const { topicImageUrl, topic, description } = settings
    const history = useHistory()

    return (
        <Column centerX className={styles.wrapper}>
            {topicImageUrl && <img src={topicImageUrl} alt='' />}
            <h1>{topic}</h1>
            <p>{description}</p>
            <Row centerY style={{ margin: '20px 0 30px 0' }}>
                <p>Created by</p>
                <FlagImage
                    type='user'
                    size={35}
                    imagePath={creator.image}
                    style={{ margin: '0 10px' }}
                />
                <p>{creator.name}</p>
            </Row>
            <Button
                color='blue'
                text='Open game'
                onClick={() => history.push(`/game/${entryHash}`)}
                style={{ width: 120 }}
            />
        </Column>
    )
}

export default GameCard
