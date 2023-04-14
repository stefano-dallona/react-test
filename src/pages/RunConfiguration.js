import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import React, { Component, useRef } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import { trackPromise } from 'react-promise-tracker';

import Settings from '../components/Settings';


export const RunConfiguration = (props) => {
    let navigate = useNavigate()
    let { runId } = useParams()
    let settings = useRef()

    const execute = (runId) => {
        navigate(`/run/${runId}/execution`)
    }

    return (
        <div id="runConfiguration" className="card p-fluid">
            <Settings ref={settings} execute={execute} paged="false"></Settings>
        </div>
    )

}