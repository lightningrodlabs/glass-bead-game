// @ts-nocheck
import React, { useState, useEffect } from 'react'
import * as d3 from 'd3'
import getBlobDuration from 'get-blob-duration'
import styles from '../styles/components/AudioTimeSlider.module.scss'
import Column from '../components/Column'
import Row from '../components/Row'
import { formatTimeMMSS } from '../helpers/util'

const AudioTimeSlider = (props: {
    audioElementId: string
    audioURL: string
    onPlay?: () => void
    onPause?: () => void
    onEnded?: () => void
}): JSX.Element => {
    const { audioURL, audioElementId, onPlay, onPause, onEnded } = props
    const [duration, setDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const [sliderPercent, setSliderPercent] = useState(0)
    const [bufferPercent, setBufferPercent] = useState(0)
    const [thumbOffset, setThumbOffset] = useState(0)

    function updateThumbOffset(percent) {
        const thumbWidth = 15
        setThumbOffset(-(thumbWidth / 100) * percent)
    }

    function updateSlider(e) {
        const audio = d3.select(`#${audioElementId}`).node()
        if (audio) {
            setSliderPercent(e.target.value)
            updateThumbOffset(e.target.value)
            audio.currentTime = (duration / 100) * e.target.value
        }
    }

    async function onLoadedData(e) {
        if (e.currentTarget.duration === Infinity) setDuration(await getBlobDuration(audioURL))
        else setDuration(e.currentTarget.duration)
    }

    function onTimeUpdate(e) {
        const percent = (e.currentTarget.currentTime / duration) * 100
        setSliderPercent(percent)
        setCurrentTime(e.currentTarget.currentTime)
        updateThumbOffset(percent)
    }

    useEffect(() => {
        const audio = d3.select(`#${audioElementId}`).node()
        if (audio) {
            audio.crossOrigin = 'anonymous'
            audio.src = audioURL
            audio.currentTime = 0
            d3.select(audio)
                .on('progress.timeSlider', () => {
                    if (audio.duration > 0) {
                        for (let i = 0; i < audio.buffered.length; i += 1) {
                            const percent =
                                (audio.buffered.end(audio.buffered.length - 1 - i) /
                                    audio.duration) *
                                100
                            setBufferPercent(percent)
                        }
                    }
                })
                .on('play.timeSlider', () => onPlay && onPlay())
                .on('pause.timeSlider', () => onPause && onPause())
                .on('ended.timeSlider', () => onEnded && onEnded())
        }
    }, [])

    return (
        <Column className={styles.wrapper}>
            <Row centerY className={styles.slider}>
                <div className={styles.progressBarBackground} />
                <div className={styles.bufferedAmount} style={{ width: `${bufferPercent}%` }} />
                <div className={styles.progressBar} style={{ width: `${sliderPercent}%` }} />
                <div
                    className={styles.thumb}
                    style={{ left: `${sliderPercent}%`, marginLeft: `${thumbOffset}px` }}
                />
                <input type='range' onClick={updateSlider} onChange={updateSlider} />
            </Row>
            <Row centerY spaceBetween className={styles.times}>
                <p>{formatTimeMMSS(currentTime)}</p>
                <p>{formatTimeMMSS(duration)}</p>
            </Row>
            <audio id={audioElementId} onLoadedData={onLoadedData} onTimeUpdate={onTimeUpdate}>
                <track kind='captions' />
            </audio>
        </Column>
    )
}

AudioTimeSlider.defaultProps = {
    onPlay: null,
    onPause: null,
    onEnded: null,
}

export default AudioTimeSlider
