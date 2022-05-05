import React, { useContext } from 'react';

import './App.css';
import Button from './components/Button';
import GlassBeadGame from './components/GlassBeadGame/GlassBeadGame'

function Home() {
  return (
    <div className="App">
      <header className="App-header">
        <GlassBeadGame history={history} />
      </header>
    </div>
  );
}

export default Home;
