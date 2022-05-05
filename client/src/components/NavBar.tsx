import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

//import { AccountContext } from '../contexts/AccountContext'
import styles from '../styles/components/NavBar.module.scss'
import config from '../Config'
import FlagImage from './FlagImage'

import Button from './Button'

const NavBar = (): JSX.Element => {
    // const {
    //     loggedIn,
    //     accountData,
    //     setLogInModalOpen,
    //     navBarDropDownModalOpen,
    //     setNavBarDropDownModalOpen,
    // } = useContext(AccountContext)
    // const { fullScreen, setFullScreen } = useContext(SpaceContext)

    const [selectedNavBarItem, setSelectedNavBarItem] = useState('')

    useEffect(() => {
        const url = window.location.href
        if (url === `${config.appURL}/` || url.includes(`${config.appURL}?alert`))
            setSelectedNavBarItem('home')
        else if (url === `${config.appURL}/s/all/posts`) setSelectedNavBarItem('posts')
        else if (url === `${config.appURL}/s/all/spaces`) setSelectedNavBarItem('spaces')
        else if (url === `${config.appURL}/s/all/users`) setSelectedNavBarItem('users')
        else setSelectedNavBarItem('')
    }, [window.location.pathname])

    return (
        <div className={styles.wrapper}>
            <div className={styles.navBarLinks}>
                <Link to='/' className={styles.navBarLink}>
                    <div
                        className={`${styles.navBarText} ${
                            selectedNavBarItem === 'home' && styles.selected
                        }`}
                    >
                        Home
                    </div>
                </Link>

                <Link to='/games' className={styles.navBarLink}>
                    <div className={styles.navBarText}>Games</div>
                </Link>
            </div>
            {/* {loggedIn ? (
                <div className={styles.accountButtons}>
                    <button
                        type='button'
                        className={styles.profileButton}
                        onClick={() => setNavBarDropDownModalOpen(!navBarDropDownModalOpen)}
                    >
                        <FlagImage type='user' size={40} imagePath={accountData.flagImagePath} />
                    </button>
                </div>
            ) : (
                <Button text='Log in' colour='blue' onClick={() => setLogInModalOpen(true)} />
            )} */}
        </div>
    )
}

export default NavBar