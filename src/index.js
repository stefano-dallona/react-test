import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { GoogleOAuthProvider } from '@react-oauth/google';

import App from './App';
import * as serviceWorker from './serviceWorker';

import reportWebVitals from './reportWebVitals';
import { RunHistory } from './pages/RunHistory';
import { RunConfiguration } from './pages/RunConfiguration';
import { RunExecution } from './pages/RunExecution';
import { RunAnalysis } from './pages/RunAnalysis';
import { UserProfile } from './pages/UserProfile';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // https://levelup.gitconnected.com/handling-access-tokens-for-google-apis-with-react-node-js-tutorial-5ebf94d8f90f
  // https://developers.google.com/identity/oauth2/web/guides/use-code-model
  // https://www.npmjs.com/package/react-google-login
  // https://dev.to/kamalhossain/refresh-token-problem-in-react-google-login-solved--1med
  // https://github.com/MomenSherif/react-oauth/issues/12#issuecomment-1131408898
  // https://github.com/MomenSherif/react-oauth/blob/master/apps/playground/src/components/CodeFlow.tsx
  // https://realpython.com/flask-google-login/
  <GoogleOAuthProvider clientId="524953903108-944ibh494ugop6i54jh18gu2pkokfi9r.apps.googleusercontent.com">
      <BrowserRouter>
        <App />
        <Routes>
          <Route path='/run/history' element={<RunHistory />} />
          <Route path='/run/configuration' element={<RunConfiguration />} />
          <Route path='/run/execution' element={<RunExecution />} />
          <Route path='/run/:runId/execution' element={<RunExecution />} />
          <Route path='/run/analysis' element={<RunAnalysis />} />
          <Route path='/run/:runId/analysis' element={<RunAnalysis />} />
          <Route path='/userprofile' element={<UserProfile />} />
        </Routes>
      </BrowserRouter>
  </GoogleOAuthProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.register();
