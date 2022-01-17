import React, { createContext, useState, useEffect } from 'react'
import { IAccountContext, IUser } from '../Interfaces'

import { getStorageItem, setStorageItem } from '../services'

export const AccountContext = createContext<IAccountContext>({} as IAccountContext)

const defaults = {
    accountData: {
        id: null,
        handle: null,
        name: null,
        createdAt: null,
    },
}

function AccountContextProvider({ children }: { children: JSX.Element }): JSX.Element {
    const [loggedIn, setLoggedIn] = useState(false)
    const [accountData, setAccountData] = useState<IUser | null>(null)
    const [accountDataLoading, setAccountDataLoading] = useState(true)
    // const [notifications, setNotifications] = useState<any[]>([])
    // const [notificationsLoading, setNotificationsLoading] = useState(true)
    // modals (todo: most to be removed...)
    const [alertModalOpen, setAlertModalOpen] = useState(false)
    const [alertMessage, setAlertMessage] = useState('')
    const [authModalOpen, setAuthModalOpen] = useState(false)
    const [logInModalOpen, setLogInModalOpen] = useState(false)
    const [registerModalOpen, setRegisterModalOpen] = useState(false)
    const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false)
    const [navBarDropDownModalOpen, setNavBarDropDownModalOpen] = useState(false)
    const [createPostModalOpen, setCreatePostModalOpen] = useState(false)
    // const [createSpaceModalOpen, setCreateSpaceModalOpen] = useState(false)
    const [createCommentModalOpen, setCreateCommentModalOpen] = useState(false)
    const [settingModalOpen, setSettingModalOpen] = useState(false)
    const [settingModalType, setSettingModalType] = useState('')
    const [imageUploadModalOpen, setImageUploadModalOpen] = useState(false)
    const [imageUploadType, setImageUploadType] = useState('')
    const [resetPasswordModalOpen, setResetPasswordModalOpen] = useState(false)
    const [resetPasswordModalToken, setResetPasswordModalToken] = useState<string | null>('')

    function getAccountData() {
        const accountData = getStorageItem<IUser>('ACCOUNT_DATA')
        if (!accountData) setAccountDataLoading(false)
        else {
            setAccountData(accountData)
            setLoggedIn(true)
        }
    }

    function updateAccountData(key: string, payload: any) {
        setAccountData({ ...accountData, [key]: payload })
    }

    function logOut() {
        console.log('AccountContext: logOut')
        // cookies.remove('accessToken', { path: '/' })
        setStorageItem('ACCOUNT_DATA', null)
        setAccountData(null)
        setLoggedIn(false)
    }

    useEffect(() => getAccountData(), [])

    return (
        <AccountContext.Provider
            value={{
                loggedIn,
                accountData,
                accountDataLoading,
                setAccountDataLoading,
                // notifications,
                // setNotifications,
                // notificationsLoading,
                // modals (todo: most to be removed...)
                alertModalOpen,
                setAlertModalOpen,
                alertMessage,
                setAlertMessage,
                authModalOpen,
                setAuthModalOpen,
                logInModalOpen,
                setLogInModalOpen,
                registerModalOpen,
                setRegisterModalOpen,
                forgotPasswordModalOpen,
                setForgotPasswordModalOpen,
                navBarDropDownModalOpen,
                setNavBarDropDownModalOpen,
                createPostModalOpen,
                setCreatePostModalOpen,
                // createSpaceModalOpen,
                // setCreateSpaceModalOpen,
                createCommentModalOpen,
                setCreateCommentModalOpen,
                settingModalOpen,
                setSettingModalOpen,
                settingModalType,
                setSettingModalType,
                imageUploadModalOpen,
                setImageUploadModalOpen,
                imageUploadType,
                setImageUploadType,
                resetPasswordModalOpen,
                setResetPasswordModalOpen,
                resetPasswordModalToken,
                setResetPasswordModalToken,
                // functions
                getAccountData,
                updateAccountData,
                // getNotifications,
                // updateAccountNotification,
                logOut,
            }}
        >
            {children}
        </AccountContext.Provider>
    )
}

export default AccountContextProvider
