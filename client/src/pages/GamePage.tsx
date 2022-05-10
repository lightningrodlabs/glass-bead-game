import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import styles from '@styles/pages/GamePage.module.scss'
import Column from '@components/Column'
import GlassBeadGame from '@src/components/GlassBeadGame'

const GamePage = ({ match }: {
    match: { url: string; params: { gameId: number } }
}): JSX.Element => {
    const { gameId } = match.params
    const history = useHistory()

    console.log('gameId: ', gameId)

    return (
        <Column className={styles.wrapper}>
            <GlassBeadGame history={history} />
        </Column>
    )
}

export default GamePage
