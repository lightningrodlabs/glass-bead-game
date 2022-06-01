import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { HolochainClient } from '@holochain-open-dev/cell-client'
import GlassBeadGameService from '@src/glassbeadgame.service'
import styles from '@styles/pages/HomePage.module.scss'
import Column from '@components/Column'
import Row from '@components/Row'
import Button from '@components/Button'
import CreateGameModal from '@components/Modals/CreateGameModal'

const Homepage = (): JSX.Element => {
    const [gbgService, setGbgService] = useState<null | GlassBeadGameService>(null)
    const [games, setGames] = useState<any[]>([])
    const [createGameModalOpen, setCreateGameModalOpen] = useState(false)
    const history = useHistory()

    async function initialiseGBGService() {
        const client = await HolochainClient.connect('ws://localhost:8888', 'glassbeadgame')
        const cellData = client.cellDataByRoleId('glassbeadgame-role')
        const cellClient = client.forCell(cellData!)
        setGbgService(new GlassBeadGameService(cellClient))
    }

    useEffect(() => {
        initialiseGBGService()
    }, [])

    useEffect(() => {
        if (gbgService)
            gbgService
                .getGames()
                .then((res) => setGames(res))
                .catch((error) => console.log(error))
    }, [gbgService])

    return (
        <Column centerX centerY className={styles.wrapper}>
            <Button color='blue' text='Create game' onClick={() => setCreateGameModalOpen(true)} />
            {createGameModalOpen && (
                <CreateGameModal
                    gbgService={gbgService}
                    games={games}
                    setGames={setGames}
                    close={() => setCreateGameModalOpen(false)}
                />
            )}
            <Column centerX centerY className={styles.wrapper}>
                {games.map((data) => (
                    <Row key={data.entryHash} spaceBetween className={styles.game}>
                        <Column>
                            <p>EntryHash: {data.entryHash}</p>
                            <p>Topic: {data.game.topic}</p>
                        </Column>
                        <Button
                            color='blue'
                            text='Open game'
                            onClick={() => history.push(`/game/${data.entryHash}`)}
                        />
                    </Row>
                ))}
            </Column>
        </Column>
    )
}

export default Homepage
