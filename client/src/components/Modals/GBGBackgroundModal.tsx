/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react'
import axios from 'axios'
import Cookies from 'universal-cookie'
import styles from '@styles/components/modals/GBGBackgroundModal.module.scss'
import config from '@src/Config'
import Button from '@components/Button'
import Modal from '@components/Modal'
import Row from '@components/Row'
import Input from '@components/Input'

const GBGBackgroundModal = (props: {
    gameData: any
    signalNewBackground: (type: 'image' | 'video', url: string, startTime?: number) => void
    close: () => void
}): JSX.Element => {
    const { gameData, signalNewBackground, close } = props
    const [imageFile, setImageFile] = useState<File>()
    const [imageURL, setImageURL] = useState('')
    const [videoURL, setVideoURL] = useState('')
    const [videoStartTime, setVideoStartTime] = useState(0)
    const [imagePreviewURL, setImagePreviewURL] = useState('')
    const [showImagePreview, setShowImagePreview] = useState(false)
    const [showVideoPreview, setShowVideoPreview] = useState(false)
    const [fileSizeError, setFileSizeError] = useState(false)
    const [loading, setLoading] = useState(false)
    const cookies = new Cookies()
    const mbLimit = 2

    function resetState() {
        setImageFile(undefined)
        setImageURL('')
        setVideoURL('')
        setImagePreviewURL('')
        setFileSizeError(false)
    }

    function removeInputFiles() {
        const input = document.getElementById('file-input') as HTMLInputElement
        if (input) input.value = ''
    }

    function selectImageFile() {
        const input = document.getElementById('file-input') as HTMLInputElement
        if (input && input.files && input.files[0]) {
            setShowVideoPreview(false)
            resetState()
            if (input.files[0].size > mbLimit! * 1024 * 1024) {
                setShowImagePreview(false)
                setFileSizeError(true)
                removeInputFiles()
            } else {
                setImageFile(input.files[0])
                setImagePreviewURL(URL.createObjectURL(input.files[0]))
                setShowImagePreview(true)
            }
        }
    }

    function selectImageURL(url) {
        setShowVideoPreview(false)
        resetState()
        removeInputFiles()
        setImageURL(url)
        setImagePreviewURL(url)
        setShowImagePreview(url.length > 0)
    }

    function selectVideoURL(url) {
        setShowImagePreview(false)
        resetState()
        removeInputFiles()
        setVideoURL(url)
        setShowVideoPreview(true)
    }

    function saveBackground() {
        if (videoURL) signalNewBackground('video', videoURL, videoStartTime)
        else signalNewBackground('image', imageURL, 0)
        setLoading(false)
        close()
    }

    return (
        <Modal centered close={close} style={{ textAlign: 'center' }}>
            <h1>Add a new background</h1>
            {showImagePreview && (
                <img
                    id='image-preview'
                    className={`${styles.imagePreview} ${styles.square}`}
                    src={imagePreviewURL}
                    alt=''
                />
            )}
            {showVideoPreview && (
                <iframe
                    className={styles.videoPreview}
                    id='videoBackground'
                    title='video background'
                    src={`https://www.youtube.com/embed/${videoURL}?t=9&autoplay=1&mute=1&enablejsapi=1`}
                />
            )}
            {/* <p>Upload an image from your device</p>
            {fileSizeError && <p>Image too large. Max size: {mbLimit}MB</p>}
            <Row className={styles.fileUploadInput}>
                <label htmlFor='file-input'>
                    {imageFile ? 'Change' : 'Upload'} image
                    <input
                        type='file'
                        id='file-input'
                        accept='.png, .jpg, .jpeg, .gif'
                        onChange={selectImageFile}
                        hidden
                    />
                </label>
            </Row> */}
            <p>Paste an image URL:</p>
            <Input
                type='text'
                placeholder='image url...'
                value={imageURL}
                onChange={(url) => selectImageURL(url)}
                style={{ marginBottom: 30 }}
            />
            <p>or choose a YouTube video background</p>
            <p>(only include the unique identifier in the videos url i.e: 6whHTP6L2Is)</p>
            <Row centerY style={{ width: '100%', marginBottom: 30 }}>
                <Input
                    type='text'
                    placeholder='youtube video url...'
                    value={videoURL}
                    onChange={(url) => selectVideoURL(url)}
                    style={{ marginRight: 20 }}
                />
                <p style={{ flexShrink: 0 }}>Video start time:</p>
                <Input
                    type='text'
                    value={videoStartTime}
                    onChange={(v) => setVideoStartTime(+v.replace(/\D/g, ''))}
                    style={{ width: 120, marginLeft: 10 }}
                />
            </Row>
            <Button
                text='Save background'
                color='blue'
                disabled={!imageURL && !imageFile && !videoURL}
                loading={loading}
                onClick={saveBackground}
            />
        </Modal>
    )
}

export default GBGBackgroundModal
