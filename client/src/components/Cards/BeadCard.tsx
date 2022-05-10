import React, { useContext, useState } from 'react'
import * as d3 from 'd3'
import styles from '@styles/components/cards/BeadCard.module.scss'
import colors from '@styles/Colors.module.scss'
import ImageTitle from '@components/ImageTitle'
import Column from '@src/components/Column'
import Row from '@src/components/Row'
import AudioVisualiser from '@src/components/AudioVisualiser'
import AudioTimeSlider from '@src/components/AudioTimeSlider'
import { ReactComponent as PlayIconSVG } from '@svgs/play-solid.svg'
import { ReactComponent as PauseIconSVG } from '@svgs/pause-solid.svg'

const BeadCard = (props: {
    postId: number
    location: string
    index: number
    bead: any
    style?: any
    className?: string
}): JSX.Element => {
    const { postId, location, index, bead, style, className } = props
    const [audioPlaying, setAudioPlaying] = useState(false)
    const audioId = `gbg-bead-audio-${postId}-${index}-${location}`

    function toggleBeadAudio(beadIndex: number, reset?: boolean): void {
        const beadAudio = d3.select(`#gbg-bead-audio-${postId}-${beadIndex}-${location}`).node()
        if (beadAudio) {
            if (!beadAudio.paused) beadAudio.pause()
            else {
                // pause all playing audio
                d3.selectAll('audio')
                    .nodes()
                    .forEach((node) => node.pause())
                // start selected bead
                if (reset) beadAudio.currentTime = 0
                beadAudio.play()
            }
        }
    }

    return (
        <Column
            id={`gbg-bead-${postId}-${index}-${location}`}
            className={`gbg-bead ${styles.bead} ${audioPlaying && styles.focused} ${className}`}
            style={style}
        >
            <ImageTitle
                type='user'
                imagePath={bead.user.flagImagePath}
                title={bead.user.name}
                fontSize={12}
                imageSize={20}
                style={{ marginRight: 10 }}
            />
            <Row centerX centerY className={styles.centerPanel}>
                <AudioVisualiser
                    audioElementId={audioId}
                    audioURL={bead.beadUrl}
                    staticBars={400}
                    staticColor={colors.audioVisualiserColor}
                    dynamicBars={80}
                    dynamicColor={colors.audioVisualiserColor}
                    style={{ width: '100%', height: 50 }}
                />
                <button
                    className={styles.playButton}
                    type='button'
                    aria-label='toggle-audio'
                    onClick={() => toggleBeadAudio(index)}
                >
                    {audioPlaying ? <PauseIconSVG /> : <PlayIconSVG />}
                </button>
            </Row>
            <AudioTimeSlider
                audioElementId={audioId}
                audioURL={bead.beadUrl}
                onPlay={() => setAudioPlaying(true)}
                onPause={() => setAudioPlaying(false)}
                onEnded={() => toggleBeadAudio(index + 1, true)}
            />
        </Column>
    )
}

BeadCard.defaultProps = {
    style: null,
    className: null,
}

export default BeadCard
