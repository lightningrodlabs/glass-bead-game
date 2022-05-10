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

import Home from './Home';
import About from './About';

import config from './Config'

import './index.css';

// TODO: maybe this isn't necessary for GBG as standalone app and we could call into a weco library to do this if we are in that context?
ReactDOM.render(
  <React.StrictMode>
    <>
      <BrowserRouter>
        {/* <AccountContextProvider> */}
          <GoogleReCaptchaProvider reCaptchaKey={config.recaptchaSiteKey}>
            <NavBar />
            <Modals />
            <Routes>
              <Route path="/" element={<Home/>} />
              <Route path="/about" element={<About/>} />
            </Routes>
          </GoogleReCaptchaProvider>
        {/* </AccountContextProvider> */}
      </BrowserRouter>
    </>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
