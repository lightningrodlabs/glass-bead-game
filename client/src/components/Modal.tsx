import {FC} from 'react'
import styles from '../styles/components/Modal.module.scss'
import CloseOnClickOutside from './CloseOnClickOutside'
import CloseButton from './CloseButton'

interface ModalProps {
    close: () => void;
    style?: any;
    centered?: boolean;
}

const Modal: FC<ModalProps> = (props) => {
    const { close, children, style, centered } = props
    return (
        <div className={`${styles.background} hide-scrollbars`}>
            <CloseOnClickOutside onClick={close}>
                <div
                    className={`${styles.modal} ${centered && styles.centered} hide-scrollbars`}
                    style={style}
                >
                    <div className={styles.closeButtonWrapper}>
                        <CloseButton size={20} onClick={close} />
                    </div>
                    {children}
                </div>
            </CloseOnClickOutside>
        </div>
    )
}

Modal.defaultProps = {
    style: null,
    centered: false,
}

export default Modal
