import React from 'react'
import styles from '@styles/pages/HomePage.module.scss'
import Button from '@components/Button'
import GlassBeadGame from '@components/GlassBeadGame'

const Homepage = ({ history }): JSX.Element => {
    return (
        <div className={styles.wrapper}>
            <Button color='blue' text='Create game' />
            {/* <GlassBeadGame history={history} /> */}
        </div>
    )
}

export default Homepage
