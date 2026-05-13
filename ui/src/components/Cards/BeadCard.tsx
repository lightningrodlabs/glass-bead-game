import React, { useEffect, useMemo, useState } from 'react'
import * as d3 from 'd3'
import type { AgentPubKey } from '@holochain/client'
import styles from '@styles/components/cards/BeadCard.module.scss'
import colors from '@styles/Colors.module.scss'
import Column from '@src/components/Column'
import Row from '@src/components/Row'
import AudioVisualiser from '@src/components/AudioVisualiser'
import AudioTimeSlider from '@src/components/AudioTimeSlider'
import AgentAvatar from '@components/AgentAvatar'
import { ReactComponent as PlayIconSVG } from '@svgs/play-solid.svg'
import { ReactComponent as PauseIconSVG } from '@svgs/pause-solid.svg'

interface Props {
    postId: string
    location: string
    index: number
    agentKey: AgentPubKey
    audio: Uint8Array
    style?: any
    className?: string
}

const BeadCard = (props: Props): JSX.Element => {
    const { postId, location, index, agentKey, audio, style = null, className = '' } = props
    const [audioPlaying, setAudioPlaying] = useState(false)
    const audioId = `gbg-bead-audio-${postId}-${index}-${location}`

    const audioURL = useMemo(() => {
        const blob = new Blob([audio as BlobPart], { type: 'audio/webm' })
        return URL.createObjectURL(blob)
    }, [audio])

    useEffect(() => () => URL.revokeObjectURL(audioURL), [audioURL])

    function toggleBeadAudio(beadIndex: number, reset?: boolean): void {
        const beadAudio = d3
            .select(`#gbg-bead-audio-${postId}-${beadIndex}-${location}`)
            .node() as HTMLAudioElement
        if (beadAudio) {
            if (!beadAudio.paused) beadAudio.pause()
            else {
                d3.selectAll('audio')
                    .nodes()
                    .forEach((node: any) => node.pause())
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
            <AgentAvatar agentPubKey={agentKey} size={20} style={{ marginRight: 10 }} />
            <Row centerX centerY className={styles.centerPanel}>
                <AudioVisualiser
                    audioElementId={audioId}
                    audioURL={audioURL}
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
                audioURL={audioURL}
                onPlay={() => setAudioPlaying(true)}
                onPause={() => setAudioPlaying(false)}
                onEnded={() => toggleBeadAudio(index + 1, true)}
            />
        </Column>
    )
}

export default BeadCard
