import '../App.css';
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';
import 'react-h5-audio-player/lib/styles.css';
import '../css/waveforms.css';

import React, { Component, forwardRef } from 'react';
import Waveforms from '../components/Waveforms';
import withNavigation from "../components/withNavigation";
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { useContainer } from "../components/ServicesContextProvider"

/*
class RunAnalysis extends Component {

    constructor(props) {
        super(props);

        this.state = {
            runId: "1be59452-a242-4e4e-bd83-4bd051bca2bb",
            filename: "Blues_Guitar.wav"
        };
    }

    componentDidMount() {

    }

    setRunId(runId) {
        this.setState({
            runId: runId
        })
    }

    setFilename(filename) {
        this.setState({
            filename: filename
        })
    }

    render() {
        return (
            <div id="runAnalysis" className="card p-fluid">
                <Waveforms runId={this.state.runId} filename={this.state.filename} segmentEventHandler={(segment) => {  }}></Waveforms>
            </div>
        )
    }
}

export default withNavigation(RunAnalysis);
*/

export const RunAnalysis = (props) => {
    let navigate = useNavigate()
    let { runId } = useParams()
    let servicesContainer = useContainer()

    return (
        runId ? (
            <div id="runAnalysis" className="card p-fluid">
                <Waveforms servicesContainer={servicesContainer} runId={runId} filename={""} segmentEventHandler={(segment) => { }}></Waveforms>
            </div>
        ) : <Navigate to={`/run/history`} state={{nextPage: "RunAnalysis"}} />
    )

}