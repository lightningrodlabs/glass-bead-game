import React from 'react'
import { BrowserRouter, Route, Switch } from 'react-router-dom'
import { createBrowserHistory } from 'history'
import HomePage from '@pages/HomePage'
import styles from '@styles/App.module.scss'

const App = (): JSX.Element => {
    // todo: create <ContextProviders> component to wrap all contexts

    return (
        <div className={styles.wrapper}>
            <BrowserRouter history={createBrowserHistory}>
                <Switch>
                    <Route path='/' exact component={HomePage} />
                </Switch>
            </BrowserRouter>
        </div>
    )
}

export default App;
