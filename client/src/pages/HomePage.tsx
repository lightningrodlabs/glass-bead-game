import React, { useEffect, useState } from 'react'
import { HolochainClient } from '@holochain-open-dev/cell-client'
import GlassBeadGameService from '@src/glassbeadgame.service'
import styles from '@styles/pages/HomePage.module.scss'
import Column from '@components/Column'
import Button from '@components/Button'
import CreateGameModal from '@components/Modals/CreateGameModal'
import GameCard from '@components/Cards/GameCard'
import { ReactComponent as CastaliaIcon } from '@svgs/castalia-logo.svg'

const Homepage = (): JSX.Element => {
    const [gbgService, setGbgService] = useState<null | GlassBeadGameService>(null)
    const [games, setGames] = useState<any[]>([])
    const [createGameModalOpen, setCreateGameModalOpen] = useState(false)

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
        <Column centerX className={styles.wrapper}>
            <Column centerX centerY className={styles.gbgIcon}>
                <CastaliaIcon />
            </Column>
            <Button color='blue' text='Create game' onClick={() => setCreateGameModalOpen(true)} />
            {createGameModalOpen && (
                <CreateGameModal
                    gbgService={gbgService}
                    games={games}
                    setGames={setGames}
                    close={() => setCreateGameModalOpen(false)}
                />
            )}
            <Column centerX centerY className={styles.games}>
                {games.map((data) => (
                    <GameCard key={data.entryHash} data={data} />
                ))}
            </Column>
        </Column>
    )
}

export default Homepage
