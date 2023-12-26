import React from 'react'
import styles from '@styles/pages/GamePage.module.scss'
import Column from '@components/Column'
import GlassBeadGame from '@src/components/GlassBeadGame'

const GamePage = (): JSX.Element => {
    return (
        <Column className={styles.wrapper}>
            <GlassBeadGame />
        </Column>
    )
}

export default GamePage
