import React, { useEffect, useState } from 'react'
import { CellClient, HolochainClient } from '@holochain-open-dev/cell-client'
import GlassBeadGameService from '@src/glassbeadgame.service'
import styles from '@styles/pages/HomePage.module.scss'
import Column from '@components/Column'
import Button from '@components/Button'
import CreateGameModal from '@components/Modals/CreateGameModal'
import GameCard from '@components/Cards/GameCard'
import { ReactComponent as CastaliaIcon } from '@svgs/castalia-logo.svg'
import { AppWebsocket, InstalledCell } from '@holochain/client'

const Homepage = (): JSX.Element => {
    const [gbgService, setGbgService] = useState<null | GlassBeadGameService>(null)
    const [games, setGames] = useState<any[]>([])
    const [createGameModalOpen, setCreateGameModalOpen] = useState(false)

    async function initialiseGBGService() {
        const client = await AppWebsocket.connect(`ws://localhost:${process.env.REACT_APP_HC_PORT}`)
        const appInfo = await client.appInfo({ installed_app_id: 'glassbeadgame' })
        const holochainClient = new HolochainClient(client)
        const cellData = appInfo.cell_data.find(
            (c: InstalledCell) => c.role_id === 'glassbeadgame-role'
        )

        if (!cellData) throw new Error('No cell with glassbeadgame-role role id was found')

        const cellClient = new CellClient(holochainClient, cellData)
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
