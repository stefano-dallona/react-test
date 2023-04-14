import '../App.css';
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import React, { Component } from 'react';
import Waveforms from '../components/Waveforms';
import withNavigation from "../components/withNavigation";


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
                <Waveforms runId={this.state.runId} filename={this.state.filename} segmentEventHandler={(segment) => { /*alert(`(x:${segment.start_sample}, width: ${segment.num_samples})`)*/ }}></Waveforms>
            </div>
        )
    }
}

export default withNavigation(RunAnalysis);