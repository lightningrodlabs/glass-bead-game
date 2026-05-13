import React, { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { encodeHashToBase64 } from '@holochain/client'
import type { EntryRecord } from '@holochain-open-dev/utils'
import type { Profile } from '@holochain-open-dev/profiles'
import styles from '@styles/components/cards/GameCard.module.scss'
import Column from '@src/components/Column'
import Row from '@src/components/Row'
import AgentAvatar from '@components/AgentAvatar'
import { ReactComponent as LockIcon } from '@svgs/lock-solid.svg'
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js'
import { AppContext } from '@src/contexts'
import { timeSinceCreated } from '@src/Helpers'
import type { GameOutput } from '@src/GameTypes'

const GameCard = (props: { game: GameOutput }): JSX.Element => {
    const { game } = props
    const { creator, created, settings, entryHash } = game
    const { topicImageUrl, topic, description, locked } = settings
    const ctx = useContext(AppContext)
    const history = useHistory()
    const [creatorProfile, setCreatorProfile] = useState<
        EntryRecord<Profile> | undefined
    >(undefined)

    useEffect(() => {
        if (!ctx) return
        ctx.profilesStore.client.getAgentProfile(creator).then(setCreatorProfile)
    }, [ctx, creator])

    // Holochain Timestamp is microseconds since epoch
    const createdMs = Number(created) / 1000
    const timeAgo = timeSinceCreated(new Date(createdMs).toISOString())

    const open = () =>
        history.push(`/game/${encodeURIComponent(encodeHashToBase64(entryHash))}`)

    return (
        <button
            type='button'
            className={styles.wrapper}
            onClick={open}
            aria-label={`Open game: ${topic || 'untitled'}`}
        >
            <Row centerY className={styles.inner}>
                {topicImageUrl ? (
                    <img className={styles.thumb} src={topicImageUrl} alt='' />
                ) : (
                    <div className={styles.thumbPlaceholder} />
                )}
                <Column className={styles.body}>
                    <Row centerY className={styles.titleRow}>
                        <h2 className={styles.topic}>{topic || 'Untitled'}</h2>
                        {description && (
                            <sl-tooltip
                                content={description}
                                placement='top'
                                hoist
                                className={styles.descriptionTooltip}
                            >
                                <span className={styles.description}>{description}</span>
                            </sl-tooltip>
                        )}
                    </Row>
                    <Row centerY className={styles.meta}>
                        <span className={styles.metaLabel}>Created by</span>
                        <AgentAvatar
                            agentPubKey={creator}
                            size={20}
                            style={{ margin: '0 6px' }}
                        />
                        {creatorProfile && (
                            <span className={styles.metaName}>
                                {creatorProfile.entry.nickname}
                            </span>
                        )}
                    </Row>
                    {timeAgo && <p className={styles.timeAgo}>{timeAgo}</p>}
                </Column>
            </Row>
            {locked && (
                <span className={styles.lockBadge} title='Game locked'>
                    <LockIcon />
                </span>
            )}
        </button>
    )
}

export default GameCard
