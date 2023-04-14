import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import 'primeflex/primeflex.css';

import React, { Component } from 'react';

import { Panel } from 'primereact/panel';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';

import RunList from '../components/RunList';
import withNavigation from "../components/withNavigation";


class RunHistory extends Component {

    constructor(props) {
        super(props);

        this.state = {
        };
    }

    componentDidMount() {

    }

    execute(e) {
        e.preventDefault();
        this.props.navigate({
            pathname: '/run/execution',
            state: {
                runId: "1234"
            },
        });
    }

    analyse(e) {
        e.preventDefault();
        this.props.navigate({
            pathname: '/run/analysis',
            params: {
                runId: "1234",
                filename: "asdfsdfsd"
            }
        });
    }

    render() {
        const startContent = (
            <React.Fragment>
                <Button icon="pi" className="mr-2" onClick={this.execute.bind(this)}>Execute</Button>
                <Button icon="pi" className="mr-2" onClick={this.analyse.bind(this)}>Analyse</Button>

                <i className="pi p-toolbar-separator mr-2" />
            </React.Fragment>
        );

        return (
            <div id="runHistory" className="card p-fluid">
                <Panel header="Run List">
                    <RunList></RunList>
                </Panel>
                <Toolbar start={startContent} />
            </div>
        )
    }
}

export default withNavigation(RunHistory);

