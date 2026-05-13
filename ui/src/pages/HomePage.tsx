import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { EntryRecord } from '@holochain-open-dev/utils'
import type { Profile } from '@holochain-open-dev/profiles'
import styles from '@styles/pages/HomePage.module.scss'
import Column from '@components/Column'
import Row from '@src/components/Row'
import Button from '@components/Button'
import EditProfileModal from '@components/Modals/EditProfileModal'
import CreateGameModal from '@components/Modals/CreateGameModal'
import GameCard from '@components/Cards/GameCard'
import LoadingWheel from '@src/components/LoadingWheel'
import DropDown from '@components/DropDown'
import HelpModal from '@components/Modals/HelpModal'
import { ReactComponent as CastaliaIcon } from '@svgs/castalia-logo.svg'
import { ReactComponent as HelpIcon } from '@svgs/question-solid.svg'
import { AppContext } from '@src/contexts'
import type { GameOutput } from '@src/GameTypes'

const SORT_OPTIONS = ['Newest first', 'Oldest first'] as const
type SortOption = (typeof SORT_OPTIONS)[number]

const Homepage = (): JSX.Element => {
    const ctx = useContext(AppContext)
    const [profile, setProfile] = useState<EntryRecord<Profile> | undefined>(undefined)
    const [games, setGames] = useState<GameOutput[]>([])
    const [editProfileModalOpen, setEditProfileModalOpen] = useState(false)
    const [createGameModalOpen, setCreateGameModalOpen] = useState(false)
    const [helpModalOpen, setHelpModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [sort, setSort] = useState<SortOption>('Newest first')
    const lastFetchRef = useRef<number>(0)
    const refreshingRef = useRef<boolean>(false)

    const fetchGames = (minIntervalMs = 0): void => {
        if (!ctx || refreshingRef.current) return
        if (minIntervalMs > 0 && Date.now() - lastFetchRef.current < minIntervalMs) return
        refreshingRef.current = true
        setRefreshing(true)
        ctx.service
            .getGames()
            .then((gamesList) => {
                setGames(gamesList)
                lastFetchRef.current = Date.now()
            })
            .catch((error) => console.log(error))
            .finally(() => {
                refreshingRef.current = false
                setRefreshing(false)
            })
    }

    useEffect(() => {
        if (!ctx) return
        const { service, profilesStore } = ctx
        Promise.all([
            profilesStore.client.getAgentProfile(service.myAgentPubKey),
            service.getGames(),
        ])
            .then(([myProfile, gamesList]) => {
                setProfile(myProfile)
                setGames(gamesList)
                lastFetchRef.current = Date.now()
                setLoading(false)
            })
            .catch((error) => console.log(error))
    }, [ctx])

    // Re-fetch when the page becomes visible again (e.g. switching back to the
    // tool in Moss). Throttled to at most once every 15s so quick toggles don't spam.
    useEffect(() => {
        const REVISIT_MIN_INTERVAL_MS = 30_000
        const onVisible = () => {
            if (document.visibilityState === 'visible') fetchGames(REVISIT_MIN_INTERVAL_MS)
        }
        const onFocus = () => fetchGames(REVISIT_MIN_INTERVAL_MS)
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', onFocus)
        return () => {
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('focus', onFocus)
        }
    }, [ctx])

    const refreshGames = () => fetchGames(0)

    const sortedGames = useMemo(() => {
        const copy = [...games]
        copy.sort((a, b) =>
            sort === 'Newest first'
                ? Number(b.created) - Number(a.created)
                : Number(a.created) - Number(b.created)
        )
        return copy
    }, [games, sort])

    if (!ctx) return <LoadingWheel />

    const canEditProfile = ctx.mode !== 'weave'

    return (
        <Column className={styles.wrapper}>
            <Row centerY spaceBetween className={styles.header}>
                <Row centerY>
                    <Column centerX centerY className={styles.gbgIcon}>
                        <CastaliaIcon />
                    </Column>
                    <button
                        className={styles.helpButton}
                        type='button'
                        onClick={() => setHelpModalOpen(true)}
                        aria-label='Help'
                    >
                        <HelpIcon />
                    </button>
                    <Button
                        color='blue'
                        text='Create game'
                        onClick={() => setCreateGameModalOpen(true)}
                        style={{ marginLeft: 10 }}
                    />
                    {canEditProfile && (
                        <Button
                            color='grey'
                            text='Edit profile'
                            onClick={() => setEditProfileModalOpen(true)}
                            style={{ marginLeft: 10 }}
                        />
                    )}
                </Row>
                <Row centerY>
                    <Button
                        color='grey'
                        text='Refresh'
                        onClick={refreshGames}
                        loading={refreshing}
                        style={{ marginRight: 10 }}
                    />
                    <DropDown
                        title='Sort'
                        options={[...SORT_OPTIONS]}
                        selectedOption={sort}
                        setSelectedOption={(o: SortOption) => setSort(o)}
                    />
                </Row>
            </Row>

            {loading ? (
                <LoadingWheel />
            ) : (
                <div className={styles.games}>
                    {sortedGames.map((game) => (
                        <GameCard key={String(game.entryHash)} game={game} />
                    ))}
                </div>
            )}

            {editProfileModalOpen && (
                <EditProfileModal
                    profile={profile}
                    onSaved={(saved) => setProfile(saved)}
                    close={() => setEditProfileModalOpen(false)}
                />
            )}
            {createGameModalOpen && (
                <CreateGameModal
                    games={games}
                    setGames={setGames}
                    close={() => setCreateGameModalOpen(false)}
                />
            )}
            {helpModalOpen && <HelpModal close={() => setHelpModalOpen(false)} />}
        </Column>
    )
}

export default Homepage
