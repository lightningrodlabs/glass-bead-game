import React from 'react'
import styles from '@styles/components/LoadingWheel.module.scss'
import { ReactComponent as LoadingWheelIconSVG } from '@svgs/spinner.svg'

const LoadingWheel = (props: { size?: number }): JSX.Element => {
    const { size = 40 } = props
    return (
        <div className={styles.wrapper} style={{ width: size, height: size }}>
            <LoadingWheelIconSVG width={size} height={size} />
        </div>
    )
}

export default LoadingWheel
