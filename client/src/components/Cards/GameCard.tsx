import React from 'react'
import { useHistory } from 'react-router-dom'
import styles from '@styles/components/cards/GameCard.module.scss'
import Column from '@src/components/Column'
import Row from '@src/components/Row'
import Button from '@components/Button'

const GameCard = (props: { data: any }): JSX.Element => {
    const { data } = props
    const history = useHistory()
    return (
        <Column className={styles.wrapper}>
            <Row style={{ marginBottom: 20 }}>
                {data.settings.topicImageUrl && <img src={data.settings.topicImageUrl} alt='' />}
                <Column>
                    <h1>{data.settings.topic}</h1>
                    <p>{data.settings.description}</p>
                </Column>
            </Row>
            <Button
                color='blue'
                text='Open game'
                onClick={() => history.push(`/game/${data.entryHash}`)}
                style={{ width: 120, marginBottom: 20 }}
            />
            <p className='grey'>EntryHash: {data.entryHash}</p>
        </Column>
    )
}

export default GameCard
