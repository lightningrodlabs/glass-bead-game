import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import Column from '@components/Column'

const AudioVisualiser = (props: {
    audioElementId: string
    audioURL: string
    staticBars: number
    staticColor: string
    dynamicBars: number
    dynamicColor: string
    style?: any
}): JSX.Element => {
    const {
        audioElementId,
        audioURL,
        staticBars,
        staticColor,
        dynamicBars,
        dynamicColor,
        style,
    } = props

    const offlineAudioContext = useRef<OfflineAudioContext | null>(null)
    const audioContext = useRef<AudioContext | null>(null)
    const audioSource = useRef<MediaElementAudioSourceNode | null>(null)

    function drawStaticVisualisation(buffer) {
        const visualiser = d3.select(`#${audioElementId}-visualiser`)
        if (visualiser.node()) {
            const { height, width } = visualiser.node().getBoundingClientRect()
            const maxBars = 8000
            const totalBars = Math.min(staticBars, maxBars)
            const leftChannel = buffer.getChannelData(0)
            const barGap = Math.floor(leftChannel.length / totalBars)
            const barWidth = width / totalBars

            const oldSVG = d3.select(`#${audioElementId}-static-visualiser`).select('svg')
            if (oldSVG.node()) oldSVG.remove()

            const staticVisualiser = d3
                .select(`#${audioElementId}-static-visualiser`)
                .append('svg')
                .attr('width', width)
                .attr('height', height)

            // find range
            let maxValue = 0
            for (let i = 0; i <= totalBars; i += 1) {
                const barIndex = Math.floor(barGap * i)
                const initialValue = leftChannel[barIndex] || 0
                const usedValue = initialValue > 0 ? initialValue : -initialValue
                if (usedValue > maxValue) maxValue = usedValue
            }

            // draw lines
            for (let i = 0; i <= totalBars; i += 1) {
                const barIndex = Math.floor(barGap * i)
                const initialValue = leftChannel[barIndex] || 0
                const usedValue = initialValue > 0 ? initialValue : -initialValue
                const barHeight = usedValue * (height / maxValue)
                const x = i * barWidth
                const y = height / 2 - barHeight / 2
                staticVisualiser
                    .append('rect')
                    .attr('id', `bar-${i}`)
                    .attr('x', x)
                    .attr('y', y)
                    .attr('width', barWidth)
                    .attr('height', barHeight)
                    .attr('fill', staticColor)
            }
        }
    }

    function loadAudioForStaticVisualisation() {
        const req = new XMLHttpRequest()
        req.open('GET', audioURL, true)
        req.responseType = 'arraybuffer'
        req.onreadystatechange = () => {
            if (req.readyState === 4) {
                offlineAudioContext.current = new OfflineAudioContext(1, 1, 8000)
                offlineAudioContext.current.decodeAudioData(
                    req.response,
                    (buffer) => drawStaticVisualisation(buffer),
                    () => null
                )
            }
        }
        req.send()
    }

    useEffect(() => {
        loadAudioForStaticVisualisation()
        const audio = d3.select(`#${audioElementId}`)
        if (audio.node()) {
            const { height, width } = d3
                .select(`#${audioElementId}-visualiser`)
                .node()
                .getBoundingClientRect()

            audio.on('play.visualiser', () => {
                const totalBars = Math.min(dynamicBars, 255)
                audioContext.current = audioContext.current || new AudioContext()
                audioSource.current =
                    audioSource.current ||
                    audioContext.current.createMediaElementSource(audio.node())
                const analyser = audioContext.current.createAnalyser()
                audioSource.current.connect(analyser)
                audioSource.current.connect(audioContext.current.destination)
                const frequencyData = new Uint8Array(analyser.frequencyBinCount)
                analyser.getByteFrequencyData(frequencyData)

                const oldSVG = d3.select(`#${audioElementId}-visualiser`).select('svg')
                if (oldSVG.node()) oldSVG.remove()

                const svg = d3
                    .select(`#${audioElementId}-visualiser`)
                    .append('svg')
                    .attr('width', '100%')
                    .attr('height', '100%')

                for (let i = 0; i < totalBars; i += 1) {
                    svg.append('rect')
                        .attr('id', `bar-${i}`)
                        .attr('x', (width / totalBars) * i)
                        .attr('y', height / 2)
                        .attr('width', width / totalBars)
                        .attr('fill', dynamicColor)
                        .style('opacity', 0.5)
                }

                const renderVisualizer = () => {
                    analyser.getByteFrequencyData(frequencyData)
                    for (let i = 0; i < totalBars; i += 1) {
                        const barIndex = Math.floor((255 / totalBars) * i)
                        const barHeight = (height / 255) * frequencyData[barIndex] // 0 to 255
                        svg.select(`#bar-${i}`)
                            .attr('height', barHeight)
                            .attr('y', height / 2 - barHeight / 2)
                    }
                    window.requestAnimationFrame(renderVisualizer)
                }
                renderVisualizer()
            })
        }
    }, [])

    return (
        <Column style={style}>
            <div id={`${audioElementId}-visualiser`} style={{ width: '100%', height: '100%' }} />
            <div id={`${audioElementId}-static-visualiser`} style={{ position: 'absolute' }} />
        </Column>
    )
}

AudioVisualiser.defaultProps = {
    style: null,
}

export default AudioVisualiser
