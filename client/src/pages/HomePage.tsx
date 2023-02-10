import React, { useEffect, useState } from 'react'
import GlassBeadGameService from '@src/glassbeadgame.service'
import styles from '@styles/pages/HomePage.module.scss'
import Column from '@components/Column'
import Button from '@components/Button'
import PlayerDetailsModal from '@components/Modals/PlayerDetailsModal'
import CreateGameModal from '@components/Modals/CreateGameModal'
import GameCard from '@components/Cards/GameCard'
import LoadingWheel from '@src/components/LoadingWheel'
import FlagImage from '@src/components/FlagImage'
import Row from '@src/components/Row'
import HelpModal from '@components/Modals/HelpModal'
import { ReactComponent as CastaliaIcon } from '@svgs/castalia-logo.svg'
import { ReactComponent as EditIcon } from '@svgs/edit-solid.svg'
import { AdminWebsocket, AppAgentWebsocket } from '@holochain/client'
import { ReactComponent as HelpIcon } from '@svgs/question-solid.svg'

const Homepage = (): JSX.Element => {
    const [gbgService, setGbgService] = useState<null | GlassBeadGameService>(null)
    const [player, setPlayer] = useState<any>(null)
    const [games, setGames] = useState<any[]>([])
    const [playerDetailsModalOpen, setPlayerDetailsModalOpen] = useState(false)
    const [createGameModalOpen, setCreateGameModalOpen] = useState(false)
    const [helpModalOpen, setHelpModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    async function initialiseGBGService() {
        if (process.env.REACT_APP_ADMIN_PORT) {
            console.log('authorizing!')
            const adminWebsocket = await AdminWebsocket.connect(
                `ws://localhost:${process.env.REACT_APP_ADMIN_PORT}`
            )
            const x = await adminWebsocket.listApps({})
            console.log('apps', x)
            const cellIds = await adminWebsocket.listCellIds()
            console.log('CELL IDS', cellIds)
            await adminWebsocket.authorizeSigningCredentials(cellIds[0])
        }

        const client = await AppAgentWebsocket.connect(
            `ws://localhost:${process.env.REACT_APP_HC_PORT}`,
            'glassbeadgame'
        )
        setGbgService(new GlassBeadGameService(client, 'glassbeadgame-role'))
    }

    useEffect(() => {
        initialiseGBGService()
    }, [])

    useEffect(() => {
        if (gbgService) {
            Promise.all([
                gbgService.getPlayerDetails(gbgService.myAgentPubKey),
                gbgService.getGames(),
            ])
                .then((data) => {
                    setPlayer(data[0])
                    setGames(data[1])
                    setLoading(false)
                })
                .catch((error) => console.log(error))
        }
    }, [gbgService])

    return (
        <Column centerX className={styles.wrapper}>
            <Column centerX centerY className={styles.gbgIcon}>
                <CastaliaIcon />
            </Column>
            {loading ? (
                <LoadingWheel />
            ) : (
                <Column>
                    {!player ? (
                        <Button
                            color='purple'
                            text='Add player details'
                            onClick={() => setPlayerDetailsModalOpen(true)}
                        />
                    ) : (
                        <Column centerX>
                            <Row centerY style={{ marginBottom: 30 }}>
                                <FlagImage
                                    type='user'
                                    size={50}
                                    imagePath={player.image}
                                    style={{ marginRight: 15 }}
                                />
                                <p className={styles.playerName}>{player.name}</p>
                                <button
                                    type='button'
                                    onClick={() => setPlayerDetailsModalOpen(true)}
                                    className={styles.editPlayerDetailsButton}
                                >
                                    <EditIcon />
                                </button>
                            </Row>
                            <Button
                                color='blue'
                                text='Create game'
                                onClick={() => setCreateGameModalOpen(true)}
                            />
                            <Column centerX centerY className={styles.games}>
                                {games.map((game) => (
                                    <GameCard key={game.entryHash} game={game} />
                                ))}
                            </Column>
                        </Column>
                    )}
                    {gbgService && playerDetailsModalOpen && (
                        <PlayerDetailsModal
                            gbgService={gbgService}
                            player={player}
                            setPlayer={setPlayer}
                            close={() => setPlayerDetailsModalOpen(false)}
                        />
                    )}
                    {gbgService && createGameModalOpen && (
                        <CreateGameModal
                            gbgService={gbgService}
                            player={player}
                            games={games}
                            setGames={setGames}
                            close={() => setCreateGameModalOpen(false)}
                        />
                    )}
                </Column>
            )}
            <button
                className={styles.helpButton}
                type='button'
                onClick={() => setHelpModalOpen(true)}
            >
                <HelpIcon />
            </button>
            {helpModalOpen && <HelpModal close={() => setHelpModalOpen(false)} />}
        </Column>
    )
}

export default Homepage
