import React, { useState } from 'react'
import Modal from '@components/Modal'
import Row from '@components/Row'
import Column from '@components/Column'
import styles from '@styles/components/modals/HelpModal.module.scss'
import { ReactComponent as LeftChevronIcon } from '@svgs/chevron-left-solid.svg'
import { ReactComponent as RightChevronIcon } from '@svgs/chevron-right-solid.svg'
import { version as appVersion } from '../../../package.json'

const NavButton = (props: {
    targetPage: number
    direction: 'back' | 'next'
    setPage: (page: number) => void
}): JSX.Element => {
    const { targetPage, direction, setPage } = props
    return (
        <button className={styles.navButton} type='button' onClick={() => setPage(targetPage)}>
            {direction === 'back' ? <LeftChevronIcon /> : <RightChevronIcon />}
        </button>
    )
}

const HelpModal = (props: { close: () => void }): JSX.Element => {
    const { close } = props
    const [page, setPage] = useState(1)

    return (
        <Modal close={close} centered>
            <h1>About The Glass Bead Game</h1>
            <Row className={styles.wrapper}>
                <Column centerY style={{ width: 30, marginRight: 20, flexShrink: 0 }}>
                    {page === 2 && (
                        <NavButton targetPage={1} direction='back' setPage={setPage} />
                    )}
                    {page === 3 && (
                        <NavButton targetPage={2} direction='back' setPage={setPage} />
                    )}
                </Column>
                {page === 1 && (
                    <Column centerX style={{ width: '100%' }}>
                        <p>
                            The Glass Bead Game is a turn-based game of co-creation which, like
                            brainstorming, facilitates the generation of creative ideas.
                        </p>
                        <p>
                            The game focuses on making space for every player to contribute to the
                            play, and encourages deep listening for collaborative meaning making.
                        </p>
                        <p>
                            Each player is given the same amount of time to speak, encouraging those
                            who typically have less of a voice to express themselves, and the beauty
                            of a game is judged on how well each players connects with the other,
                            cultivating deep listening. The social pressure of being
                            &apos;right&apos; is reduced by the playful nature of the game, and the
                            ideal of avoiding I and you helps keep our egos at bay.
                        </p>
                    </Column>
                )}
                {page === 2 && (
                    <Column centerX style={{ width: '100%' }}>
                        <p>Take one minute turns to speak on a topic, and aim for these ideals:</p>
                        <p>Listen deeply.</p>
                        <p>Avoid the use of I and You.</p>
                        <p>Connect with the previous move.</p>
                        <p>But:</p>
                        <p>Use the timer to customise the length and number of the turns.</p>
                        <p>And:</p>
                        <p>Come up with your own ideals :)</p>
                        <p>Enjoy!</p>
                    </Column>
                )}
                {page === 3 && (
                    <Column centerX style={{ width: '100%' }}>
                        <p>
                            This{' '}
                            <a
                                href='https://www.weco.io/s/gbg/posts'
                                target='_blank'
                                rel='noreferrer'
                            >
                                incarnation
                            </a>{' '}
                            of the Glass Bead Game was developed originally by James and
                            Gnoman for{' '}
                            <a
                                href='https://www.weco.io/s/all/about'
                                target='_blank'
                                rel='noreferrer'
                            >
                                weco.io
                            </a>{' '}
                            and now as a collaboration with{' '}
                            <a
                                href='https://lightningrodlabs.org'
                                target='_blank'
                                rel='noreferrer'
                            >
                                Lightningrod Labs
                            </a>{' '}
                            to bring its carefull playfulness to your Moss group.
                        </p>
                        <p className={styles.version}>Version {appVersion}</p>
                    </Column>
                )}
                <Column centerY style={{ width: 30, marginLeft: 20, flexShrink: 0 }}>
                    {page === 1 && (
                        <NavButton targetPage={2} direction='next' setPage={setPage} />
                    )}
                    {page === 2 && (
                        <NavButton targetPage={3} direction='next' setPage={setPage} />
                    )}
                </Column>
            </Row>
        </Modal>
    )
}

export default HelpModal
