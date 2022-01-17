import React, { useContext } from 'react'
import { Link } from 'react-router-dom'

import { AccountContext } from '../../contexts/AccountContext'
import styles from '../../styles/components/NavBarDropDownModal.module.scss'

import CloseOnClickOutside from '../CloseOnClickOutside'

const NavBarDropDownModal = (): JSX.Element => {
    const { setNavBarDropDownModalOpen, accountData, logOut } = useContext(AccountContext)

    return (
        <div className={styles.modalWrapper}>
            <CloseOnClickOutside onClick={() => setNavBarDropDownModalOpen(false)}>
                <div className={styles.modal}>
                    <Link
                        to={`/u/${accountData.handle}/about`}
                        className={styles.link}
                        onClick={() => {
                            setNavBarDropDownModalOpen(false)
                        }}
                    >
                        <img className={styles.linkIcon} src='/icons/user-solid.svg' />
                        <span className={styles.linkText}>Profile</span>
                    </Link>
                    <div
                        className='wecoButton mt-10'
                        role='button'
                        tabIndex={0}
                        onClick={() => {
                            logOut()
                            setNavBarDropDownModalOpen(false)
                        }}
                        onKeyDown={() => {
                            logOut()
                            setNavBarDropDownModalOpen(false)
                        }}
                    >
                        Log Out
                    </div>
                </div>
            </CloseOnClickOutside>
            {/* </div> */}
        </div>
    )
}

export default NavBarDropDownModal
