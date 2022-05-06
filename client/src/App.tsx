import React from 'react'
import { BrowserRouter, Route, Switch, Link } from 'react-router-dom'
import { createBrowserHistory } from 'history'
import styles from '@styles/App.module.scss'
import Row from '@components/Row'
import HomePage from '@pages/HomePage'
import GamesPage from '@pages/GamesPage'
import GamePage from '@pages/GamePage'

const App = (): JSX.Element => {
    return (
        <div className={styles.wrapper}>
            <BrowserRouter history={createBrowserHistory}>
                <Row centerX centerY className={styles.navbar}>
                    <Link to='/'>
                        <p>Home</p>
                    </Link>
                    <Link to='/games'>
                        <p>Games</p>
                    </Link>
                </Row>
                <Switch>
                    <Route path='/' exact component={HomePage} />
                    <Route path='/games' exact component={GamesPage} />
                    <Route path='/game/:gameId' component={GamePage} />
                </Switch>
            </BrowserRouter>
        </div>
    )
}

export default App
