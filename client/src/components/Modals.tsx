import React, { useContext } from 'react'
import { AccountContext } from '../contexts/AccountContext'

// import CreatePostModal from './Modals/CreatePostModal'
import AlertModal from './Modals/AlertModal'
import LogInModal from './Modals/LogInModal'
import RegisterModal from './Modals/RegisterModal'
import NavBarDropDownModal from './Modals/NavBarDropDownModal'

const Modals = (): JSX.Element => {
    const {
        alertModalOpen,
        logInModalOpen,
        setLogInModalOpen,
        registerModalOpen,
        setRegisterModalOpen,
        navBarDropDownModalOpen,
        // createPostModalOpen,
    } = useContext(AccountContext)

    return (
        <>
            {alertModalOpen && <AlertModal />}
            {logInModalOpen && <LogInModal close={() => setLogInModalOpen(false)} />}
            {registerModalOpen && <RegisterModal close={() => setRegisterModalOpen(false)} />}
            {navBarDropDownModalOpen && <NavBarDropDownModal />}
            {/* {createPostModalOpen && <CreatePostModal />} */}
        </>
    )
}

export default Modals
