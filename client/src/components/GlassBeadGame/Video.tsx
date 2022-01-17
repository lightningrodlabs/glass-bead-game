import React from 'react'

import styles from '../../styles/components/GlassBeadGame.module.scss'

import ImageTitle from '../ImageTitle'

import { IUser } from '../../Interfaces'

import { ReactComponent as AudioIconSVG } from '../../svgs/microphone-solid.svg'
import { ReactComponent as AudioSlashIconSVG } from '../../svgs/microphone-slash-solid.svg'
import { ReactComponent as VideoIconSVG } from '../../svgs/video-solid.svg'
import { ReactComponent as VideoSlashIconSVG } from '../../svgs/video-slash-solid.svg'

interface VideoProps {
    id: string;
    user: IUser;
    size: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
    toggleAudio?: React.MouseEventHandler,
    toggleVideo?: React.MouseEventHandler,
    audioOnly: boolean;
}

export const Video: React.FC<VideoProps> = (props) => {
    const {
        id,
        user,
        size,
        audioEnabled,
        videoEnabled,
        toggleAudio,
        toggleVideo,
        audioOnly,
    } = props
    return (
        <div className={`${styles.videoWrapper} ${size}`}>
            {audioOnly && <AudioIconSVG />}
            <video id={id} muted={id === 'your-video'} autoPlay playsInline>
                <track kind='captions' />
            </video>
            <div className={styles.videoUser}>
                <ImageTitle
                    type='user'
                    imagePath={user.flagImagePath}
                    title={id === 'your-video' ? 'You' : user.name}
                />
            </div>
            {id === 'your-video' && (
                <div className={styles.videoButtons}>
                    <button type='button' onClick={toggleAudio}>
                        {audioEnabled ? <AudioIconSVG /> : <AudioSlashIconSVG />}
                    </button>
                    {!audioOnly && (
                        <button type='button' onClick={toggleVideo}>
                            {videoEnabled ? <VideoIconSVG /> : <VideoSlashIconSVG />}
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

export default Video