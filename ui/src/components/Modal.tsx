import React from 'react'
import styles from '@styles/components/Modal.module.scss'
import CloseOnClickOutside from '@components/CloseOnClickOutside'
import CloseButton from '@components/CloseButton'

const Modal = (props: {
    close: () => void
    children: any
    style?: any
    centered?: boolean
    closeOnClickOutside?: boolean
}): JSX.Element => {
    const {
        close,
        children,
        style = null,
        centered = false,
        closeOnClickOutside = true,
    } = props
    const inner = (
        <div
            className={`${styles.modal} ${centered && styles.centered} hide-scrollbars`}
            style={style}
        >
            <div className={styles.closeButtonWrapper}>
                <CloseButton size={20} onClick={close} />
            </div>
            {children}
        </div>
    )
    return (
        <div className={`${styles.background} hide-scrollbars`}>
            {closeOnClickOutside ? (
                <CloseOnClickOutside onClick={close}>{inner}</CloseOnClickOutside>
            ) : (
                inner
            )}
        </div>
    )
}

export default Modal
