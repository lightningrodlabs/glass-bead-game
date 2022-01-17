import React, { useContext, useState, useEffect, FormEvent } from 'react'
import axios from 'axios'
// import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

import config from '../../Config'
import styles from '../../styles/components/Modal.module.scss'
import { AccountContext } from '../../contexts/AccountContext'
import Modal from '../Modal'
import Column from '../Column'
import Input from '../Input'
import Button from '../Button'
import LoadingWheel from '../LoadingWheel'
import SuccessMessage from '../SuccessMessage'

import { ACCOUNT_DATA, login, setStorageItem } from '../../services'

const LogInModal = (props: { close: () => void }): JSX.Element => {
    const { close } = props
    const {
        getAccountData,
        setRegisterModalOpen,
        setAccountDataLoading,
    } = useContext(AccountContext)
    // const { executeRecaptcha } = useGoogleReCaptcha()

    type InputState = 'default' | 'valid' | 'invalid'

    const [emailOrHandle, setEmailOrHandle] = useState('')
    const [emailOrHandleState, setEmailOrHandleState] = useState<InputState>('default')
    const [emailOrHandleErrors, setEmailOrHandleErrors] = useState<string[]>([])

    const [password, setPassword] = useState('')
    const [passwordState, setPasswordState] = useState<InputState>('default')
    const [passwordErrors, setPasswordErrors] = useState<string[]>([])

    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    const [logInFlashMessage, setLogInFlashMessage] = useState('')

    function logIn(e: FormEvent) {
        e.preventDefault()
        const invalidEmailOrHandle = emailOrHandle.length < 1
        const invalidPassword = password.length < 1
        setEmailOrHandleState(invalidEmailOrHandle ? 'invalid' : 'valid')
        setEmailOrHandleErrors(invalidEmailOrHandle ? ['Required'] : []) // Please enter your handle or email
        setPasswordState(invalidPassword ? 'invalid' : 'valid')
        setPasswordErrors(invalidPassword ? ['Required'] : []) // Please enter your password

        if (!invalidEmailOrHandle && !invalidPassword) {
            setLoading(true)
            // executeRecaptcha && executeRecaptcha('login').then((reCaptchaToken) => {
                login(emailOrHandle, password)
                    .then(res => {
                        console.log('hey', res)
                        if (!res) {
                            throw new Error('User not found');
                        }
                        const accountData = res.profile;
                        setStorageItem(ACCOUNT_DATA, accountData)

                        setLoading(false)
                        setSuccess(true)
                        // document.cookie = `accessToken=${res.data}; path=/`
                        setAccountDataLoading(true)
                        getAccountData()
                        setTimeout(() => close(), 1000)
                    })
                    .catch((error) => {
                        setLoading(false)
                        switch (error.message) {
                            case 'User not found':
                                setEmailOrHandleState('invalid')
                                setEmailOrHandleErrors(['User not found'])
                                break
                            case 'Incorrect password':
                                setPasswordState('invalid')
                                setPasswordErrors(['Incorrect password'])
                                break
                            default:
                                break
                        }
                    })
            // })
        }
    }

    useEffect(() => {
        // make recaptcha flag visible
        const recaptchaBadge = document.getElementsByClassName('grecaptcha-badge')[0] as HTMLElement
        if (!recaptchaBadge) { return }
        recaptchaBadge.style.visibility = 'visible'
        return () => {
            recaptchaBadge.style.visibility = 'hidden'
        }
    })

    return (
        <Modal close={close} style={{ minWidth: 350 }} centered>
            <h1>Log in</h1>
            <form onSubmit={logIn}>
                <Column style={{ marginBottom: 20, width: '100%' }}>
                    <Input
                        type='text'
                        title='Username'
                        placeholder='username...'
                        style={{ marginBottom: 10 }}
                        state={emailOrHandleState}
                        errors={emailOrHandleErrors}
                        value={emailOrHandle}
                        onChange={(newValue) => {
                            setEmailOrHandleState('default')
                            setEmailOrHandle(newValue)
                        }}
                    />
                    <Input
                        type='password'
                        title='Password'
                        placeholder='password...'
                        style={{ marginBottom: 10 }}
                        state={passwordState}
                        errors={passwordErrors}
                        value={password}
                        onChange={(newValue) => {
                            setPasswordState('default')
                            setPassword(newValue)
                        }}
                    />
                </Column>
                {logInFlashMessage.length > 0 && <p className='danger'>{logInFlashMessage}</p>}
                {!loading && !success && (
                    <Button
                        text='Log in'
                        colour='blue'
                        disabled={
                            emailOrHandleState === 'invalid' ||
                            passwordState === 'invalid' ||
                            !!logInFlashMessage.length
                        }
                        submit
                    />
                )}
                {loading && <LoadingWheel />}
                {success && <SuccessMessage text='Logged in' />}
                <Column style={{ marginTop: 20 }} centerX>
                    <p>
                        New?{' '}
                        <button
                            type='button'
                            className={styles.textButton}
                            onClick={() => {
                                setRegisterModalOpen(true)
                                close()
                            }}
                        >
                            Create a new account
                        </button>
                    </p>
                    {/* <p>
                        <button
                            type='button'
                            className={styles.textButton}
                            onClick={() => {
                                setForgotPasswordModalOpen(true)
                                close()
                            }}
                        >
                            Forgot your password?
                        </button>
                    </p> */}
                </Column>
            </form>
        </Modal>
    )
}

export default LogInModal
