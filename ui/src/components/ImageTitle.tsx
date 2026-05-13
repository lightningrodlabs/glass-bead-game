import React from 'react'
import { Link } from 'react-router-dom'
import styles from '@styles/components/ImageTitle.module.scss'
import FlagImage from '@components/FlagImage'

const ImageTitle = (props: {
    type: 'space' | 'user'
    imagePath: string
    imageSize?: number
    title: string
    fontSize?: number
    style?: any
    shadow?: boolean
    link?: string
    wrapText?: boolean
    onClick?: () => void
}): JSX.Element => {
    const {
        type,
        imagePath,
        imageSize = 30,
        title,
        fontSize = 14,
        style = null,
        shadow = false,
        link,
        wrapText = false,
        onClick,
    } = props
    if (link) {
        return (
            <Link
                to={link}
                onClick={onClick}
                className={`${styles.container} ${styles.clickable}`}
                style={style}
            >
                <FlagImage type={type} size={imageSize!} imagePath={imagePath} shadow={shadow} />
                <p style={{ fontSize }} className={wrapText ? styles.wrapText : ''}>
                    {title}
                </p>
            </Link>
        )
    }
    if (onClick) {
        return (
            <button
                type='button'
                onClick={onClick}
                className={`${styles.container} ${styles.clickable}`}
                style={style}
            >
                <FlagImage type={type} size={imageSize!} imagePath={imagePath} shadow={shadow} />
                <p style={{ fontSize }} className={wrapText ? styles.wrapText : ''}>
                    {title}
                </p>
            </button>
        )
    }
    return (
        <div className={styles.container} style={style}>
            <FlagImage type={type} size={imageSize!} imagePath={imagePath} shadow={shadow} />
            <p style={{ fontSize }} className={wrapText ? styles.wrapText : ''}>
                {title}
            </p>
        </div>
    )
}

export default ImageTitle
