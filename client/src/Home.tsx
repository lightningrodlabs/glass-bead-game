import React, { useContext } from 'react';

import './App.css';
import Button from './components/Button';
import { AccountContext } from './contexts/AccountContext'

function Home() {
  const {
    setLogInModalOpen,
} = useContext(AccountContext)

  return (
    <div className="App">
      <header className="App-header">
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <p>
          <Button text="Login" onClick={() => setLogInModalOpen(true)} colour='blue' />
        </p>
      </header>
    </div>
  );
}

export default Home;
