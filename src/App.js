import logo from './logo.svg';
import './App.css';
import "primereact/resources/themes/vela-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import { React, useState, useEffect, useRef } from 'react'
import { googleLogout, useGoogleLogin } from '@react-oauth/google';
import { BlockUI } from 'primereact/blockui';

import { ThreeDots, ColorRing } from 'react-loader-spinner';
import { usePromiseTracker } from 'react-promise-tracker';
import { trackPromise } from 'react-promise-tracker';

import { Toast } from 'primereact/toast'

import axios from 'axios'

import Navigation from './components/Navigation';
import { useContainer } from "./components/ServicesContextProvider"
import { StreamingChart } from './components/SimpleChart'


function App() {
  let servicesContainer = useContainer()
  let toast = useRef(null);

  const testConnectivity = async () => {
    try {
      let response = await servicesContainer.testConnectivity()
      console.log("Connection test succeeded")
    } catch (error) {
      if (toast && error.response?.status === 401) {
        toast.current.show({ severity: "info", summary: "Please authenticate.", detail: "" });
      }
    }
  }

  useEffect(() => {
    testConnectivity()
    window.globalToast = toast
  })


  const LoadingIndicator = props => {
    const { promiseInProgress } = usePromiseTracker();

    return promiseInProgress &&
      <div
        style={{
          width: "100%",
          height: "100",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1000
        }}
      >
        <BlockUI blocked={true} fullScreen />
        <ColorRing type="ColorRing" color="#2BAD60" height="100" width="100" />
      </div>
  };

  const fakeLoading = async () => {
    trackPromise(
      new Promise(resolve => setTimeout(resolve, 1000))
    );
  }
  //<ProgressSpinner style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: "1000" }} />

  return (
    <div className="App">
      {false && (<header className="App-header">
        <p>
          PLC TestBench UI
        </p>
      </header>)}
      <Toast ref={toast} />
      <LoadingIndicator />
      <Navigation />
      {false && (
        <StreamingChart />
      )}
    </div>
  );
}

export default App;
