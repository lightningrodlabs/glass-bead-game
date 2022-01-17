import React from 'react'

import { IComment, IUser } from '../../Interfaces'
import FlagImage from '../FlagImage'
import Row from '../Row'
import {
    timeSinceCreated,
    dateCreated,
} from '../../helpers/util'

import styles from '../../styles/components/GlassBeadGame.module.scss'

interface CommentProps {
    comment: IComment & {
        user: IUser;
        createdAt?: string;
    }
}

export const Comment: React.FC<CommentProps> = (props) => {
    const { comment } = props
    const { user, text, createdAt } = comment
    if (user)
        return (
            <div className={styles.userComment}>
                <FlagImage type='user' size={40} imagePath={user.flagImagePath} />
                <div className={styles.commentText}>
                    <Row>
                        <h1>{user.name}</h1>
                        <p title={dateCreated(createdAt)}>{timeSinceCreated(createdAt)}</p>
                    </Row>
                    <p>{text}</p>
                </div>
            </div>
        )
    return (
        <div className={styles.adminComment}>
            <p>{text}</p>
        </div>
    )
}

export default Comment