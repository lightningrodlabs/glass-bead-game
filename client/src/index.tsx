import React from 'react';
import ReactDOM from 'react-dom';
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom"
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

import reportWebVitals from './reportWebVitals';


import Modals from './components/Modals';
import NavBar from './components/NavBar';

import AccountContextProvider from './contexts/AccountContext'

import Home from './Home';
import About from './About';

import config from './Config'

import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <>
      <BrowserRouter>
        <AccountContextProvider>
          <GoogleReCaptchaProvider reCaptchaKey={config.recaptchaSiteKey}>
            <NavBar />
            <Modals />
            <Routes>
              <Route path="/" element={<Home/>} />
              <Route path="/about" element={<About/>} />
            </Routes>
          </GoogleReCaptchaProvider>
        </AccountContextProvider>
      </BrowserRouter>
    </>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
