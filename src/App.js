import logo from './logo.svg';
import './App.css';
import "primereact/resources/themes/vela-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BlockUI } from 'primereact/blockui';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import ReactWaves from "@dschoon/react-waves";
import { ThreeDots, ColorRing } from 'react-loader-spinner';
import { usePromiseTracker } from 'react-promise-tracker';
import { trackPromise } from 'react-promise-tracker';

import Navigation from './components/Nav';
import About from './components/About';
import Contact from './components/Contact';
import FilesList from './components/FilesList';
import RunHierarchy from './components/RunHierarchy'
import Waveforms from './components/Waveforms';
import RunList from './components/RunList';

function App() {

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
      new Promise(resolve => setTimeout(resolve, 3000))
    );
  }
  //<ProgressSpinner style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: "1000" }} />
  return (
    <div className="App">
      <LoadingIndicator />
      <header className="App-header">
        <p>
          PLC TestBench UI
        </p>
      </header>
      <Navigation />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={null} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
        </Routes>
      </BrowserRouter>
      <FilesList />
      <Button label="Block" onClick={fakeLoading} />
      <RunHierarchy runId={"1be59452-a242-4e4e-bd83-4bd051bca2bb"} filename={"Blues_Bass.wav"} />
      <Waveforms runId={"1be59452-a242-4e4e-bd83-4bd051bca2bb"} filename={"Blues_Bass.wav"} segmentEventHandler={(segment) => { /*alert(`(x:${segment.start_sample}, width: ${segment.num_samples})`)*/ }}/>
      <RunList></RunList>
    </div>
  );
}

export default App;
