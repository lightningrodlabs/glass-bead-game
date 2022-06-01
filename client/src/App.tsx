import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { createBrowserHistory } from 'history'
import styles from '@styles/App.module.scss'
import HomePage from '@pages/HomePage'
import GamePage from '@pages/GamePage'

const App = (): JSX.Element => {
    return (
        <div className={styles.wrapper}>
            <BrowserRouter history={createBrowserHistory}>
                <Switch>
                    <Route path='/' exact component={HomePage} />
                    <Route path='/game/:gameId' component={GamePage} />
                </Switch>
            </BrowserRouter>
        </div>
    )
}

export default App
