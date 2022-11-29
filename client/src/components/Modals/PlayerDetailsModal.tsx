import React, { useState } from 'react'
import Button from '@components/Button'
import Modal from '@components/Modal'
import Input from '@components/Input'
import FlagImage from '@components/FlagImage'
import GlassBeadGameService from '@src/glassbeadgame.service'

const PlayerDetailsModal = (props: {
    gbgService: GlassBeadGameService
    player: any
    setPlayer: (player: any) => void
    close: () => void
}): JSX.Element => {
    const { gbgService, player, setPlayer, close } = props
    const [name, setName] = useState(player ? player.name : '')
    const [image, setImage] = useState(player ? player.image : '')
    const [loading, setLoading] = useState(false)

    function saveDetails() {
        setLoading(true)
        gbgService
            .savePlayerDetails({ agentKey: gbgService.myAgentPubKey, name, image })
            .then(() => {
                setPlayer({ name, image })
                close()
                setLoading(false)
            })
            .catch((error) => console.log('player details error: ', error))
    }

    return (
        <Modal close={close} centered>
            <h1>Player details</h1>
            <FlagImage type='user' size={150} imagePath={image} style={{ marginBottom: 30 }} />
            <Input
                type='text'
                placeholder='Name...'
                value={name}
                onChange={(value) => setName(value)}
                style={{ marginBottom: 30 }}
            />
            <Input
                type='text'
                placeholder='Image URL...'
                value={image}
                onChange={(value) => setImage(value)}
                style={{ marginBottom: 30 }}
            />
            <Button
                text='Save details'
                color='blue'
                disabled={!name}
                loading={loading}
                onClick={saveDetails}
            />
        </Modal>
    )
}

export default PlayerDetailsModal
