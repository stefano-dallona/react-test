import React, { Component } from 'react';

import { Panel } from 'primereact/panel';

import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

import InputFilesSelector from './InputFilesSelector';
import WorkersSettings from './WorkersSettings';

import defaultSettings from '../assets/settings.json'

import cloneDeep from 'lodash/cloneDeep';

class Settings extends Component {

    constructor(props) {
        super(props);

        this.toast = React.createRef();
        this.paged = props.paged || true

        this.pages = ["Input File Selection", "GlobalSettings", "PlsAlgorithm", "PlcAlgorithm", "OutputAnalyser"]

        this.defaultSettings = defaultSettings

        this.state = {
            currentPage: 0
        };

        this.renderWorkerSettings = this.renderWorkerSettings.bind(this)
    }

    componentDidMount() {

    }

    setCurrentPage(currentPage) {
        this.setState({
            currentPage: currentPage
        })
    }

    previousPage = () => {
        if (this.isFirstPage()) return
        this.setCurrentPage(this.state.currentPage - 1)
    }

    nextPage = () => {
        if (this.isLastPage()) return
        this.setCurrentPage(this.state.currentPage + 1)
    }

    isFirstPage = () => {
        return (this.state.currentPage == 0)
    }

    isLastPage = () => {
        return (this.state.currentPage == this.pages.length - 1)
    }

    getProgress = () => {
        return `${this.pages[this.state.currentPage]} - Step ${this.state.currentPage + 1} of ${this.pages.length}`
    }

    newConfiguration = () => {
        this.setState({
            settings: cloneDeep(this.defaultSettings)
        });
    }

    save = () => {
        this.toast.current.show({ severity: 'info', summary: JSON.stringify(this.state.selectedOutputAnalysers), detail: 'Run configuration saved!' });
    }

    delete = () => {
        this.toast.current.show({ severity: 'info', summary: 'Info', detail: 'Run configuration deleted!' });
    }

    getToolBarButtons = () => {
        return (<React.Fragment>
            <Button label="<&nbsp;Previous" icon="pi" className='mr-2' onClick={this.previousPage}></Button>
            <Button label="Next >" icon="pi" className='mr-2' onClick={this.nextPage}></Button>
            {this.isLastPage() && (
                <Button label="Save" icon="pi pi-save" className='mr-2' onClick={this.save}></Button>
            )}
        </React.Fragment>
        )
    }

    renderWorkerSettings = (workerType) => {
        return (
            <WorkersSettings
                key={workerType}
                header={this.paged ? this.getProgress() : null}
                toggleable={this.toggleable} toast={this.toast}
                workerType={workerType}
                defaultSettings={this.defaultSettings.find((setting) => setting.property == workerType).value}>
            </WorkersSettings>
        )
    }

    render() {
        return (
            <div className="card p-fluid">
                <Toast ref={this.toast} />
                {(!this.paged || this.state.currentPage == 0) && (
                    <Panel header={this.paged ? this.getProgress() : null} toggleable={this.toggleable} >
                        <InputFilesSelector></InputFilesSelector>
                    </Panel>
                )}
                {this.pages.slice(1).filter((workerType, index) => !this.paged || this.state.currentPage == index + 1).map((workerType) => {
                    return this.renderWorkerSettings(workerType)
                })}
                <Toolbar start={this.getToolBarButtons()} />
            </div>
        )
    }
}

export default Settings;