import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App';
import reportWebVitals from './reportWebVitals';
import { RunHistory } from './pages/RunHistory';
import { RunConfiguration } from './pages/RunConfiguration';
import { RunExecution } from './pages/RunExecution';
import { RunAnalysis } from './pages/RunAnalysis';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  //<React.StrictMode>
  <BrowserRouter>
    <App />
    <Routes>
      <Route path='/run/history' element={<RunHistory />} />
      <Route path='/run/configuration' element={<RunConfiguration />} />
      <Route path='/run/execution' element={<RunExecution />} />
      <Route path='/run/:runId/execution' element={<RunExecution />} />
      <Route path='/run/analysis' element={<RunAnalysis />} />
      <Route path='/run/:runId/analysis' element={<RunAnalysis />} />
    </Routes>
  </BrowserRouter>
  //</React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
