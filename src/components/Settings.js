import React, { Component } from 'react';

import { Panel } from 'primereact/panel';

import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';

import InputFilesSelector from './InputFilesSelector';
import WorkersSettings from './WorkersSettings';

//import defaultSettings from '../assets/settings.json';
import { ConfigurationService } from '../services/testbench-configuration-service';

import cloneDeep from 'lodash/cloneDeep';

class Settings extends Component {

    constructor(props) {
        super(props);

        this.toast = React.createRef();
        this.inputFilesSelector = React.createRef();
        this.workerSettings = React.createRef();

        this.execute = props.execute

        let baseUrl = "http://localhost:5000"
        this.configurationService = new ConfigurationService(baseUrl)

        this.paged = props.paged || true

        this.pages = ["InputFileSelection", "GlobalSettings", "PacketLossSimulator", "PLCAlgorithm", "OutputAnalyser"]

        this.defaultSettings = []
        this.storedSettings = []
        this.runId = null

        this.state = {
            currentPage: 0
        };

        this.renderWorkerSettings = this.renderWorkerSettings.bind(this)
    }

    async componentDidMount() {
        this.defaultSettings = await this.configurationService.getSettingsMetadata()
    }

    setCurrentPage(currentPage) {
        this.setState({
            currentPage: currentPage
        })
    }

    getCurrentPageName() {
        return this.pages[this.state.currentPage]
    }

    previousPage = () => {
        if (this.isFirstPage()) return
        this.setCurrentPage(this.state.currentPage - 1)
    }

    showMessage = (severity, summary, detail) => {
        this.toast.current.show({ severity: severity, summary: summary, detail: detail });
    }

    validateSettings = () => {
        let errors = []

        const validate = (workerSettings) => {
            let errors = []
            errors = errors.concat(workerSettings.settings.filter((setting) => {
                return setting.value == null
            }).map((setting) => {
                return `${workerSettings.name}: ${setting.property} cannot be null`
            }))
            return errors
        }

        if (this.getCurrentPageName() == "InputFileSelection") {
            let workerSettings = this.getPageSettings()
            if (workerSettings.settings.length == 0)
                errors.push(`${this.getCurrentPageName()}: At least one audio file must be selected`)
        } else {
            let workerSettings = this.getPageSettings()
            if (workerSettings) {
                let workersSettings = (workerSettings instanceof Array) ? workerSettings : [workerSettings]
                if (workersSettings.length == 0) {
                    errors.push(`${this.getCurrentPageName()}: Settings need to be filled in`)
                } else {
                    errors = workersSettings.flatMap((workerSettings) => {
                        return validate(workerSettings)
                    })
                }
            } else {
                errors.push(`${this.getCurrentPageName()}: Settings need to be filled in`)
            }
        }
        return errors
    }

    getPageSettings = (page = this.state.currentPage) => {
        if (page == 0)
            return { name: this.pages[page], settings: this.inputFilesSelector.current.state.selectedInputFiles }
        else {
            let selectedWorkers = this.workerSettings.current.state.selectedWorkers
            let currentWorkerSettings = this.workerSettings.current.state.currentWorkerSettings
            let currentWorkerDefaultSettings = this.workerSettings.current.defaultSettings
            return (currentWorkerDefaultSettings.length > 1) ? selectedWorkers : currentWorkerSettings
        }
    }

    storeSettings() {
        let errors = this.validateSettings(this.getPageSettings())
        let result = (errors.length == 0)
        if (result) this.storedSettings[this.state.currentPage] = this.getPageSettings()
        return [result, errors]
    }

    nextPage = () => {
        if (this.isLastPage()) return

        let [success, errors] = this.storeSettings()
        if (!success) {
            errors.forEach((error) => this.showMessage('error', error, ""))
            return
        }

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

    save = async () => {
        let [success, errors] = this.storeSettings()
        if (success) {
            this.runId = await this.configurationService.saveRunConfiguration(this.storedSettings.flatMap((item) => item))
            let details = "" //JSON.stringify(this.storedSettings)
            this.toast.current.show({ severity: 'info', summary: `Run configuration saved!\nUUID:${this.runId}`, detail: details });
            if (this.execute) {
                setTimeout(this.execute(this.runId), 2000)
            }
        } else {
            errors.forEach((error) => this.showMessage('error', error, ""))
        }
    }

    delete = () => {
        this.toast.current.show({ severity: 'info', summary: 'Info', detail: 'Run configuration deleted!' });
    }

    getToolBarButtons = () => {
        return (<React.Fragment>
            <Button
                rounded
                icon="pi pi-angle-left"
                tooltip="Previous"
                tooltipOptions={{ position: 'top' }}
                className='mr-2'
                onClick={this.previousPage}
                disabled={this.isFirstPage()}></Button>
            <Button
                rounded
                icon="pi pi-angle-right"
                tooltip="Next"
                tooltipOptions={{ position: 'top' }}
                className='mr-2'
                onClick={this.nextPage}
                disabled={this.isLastPage()}></Button>
            {this.isLastPage() && (
                <Button
                    rounded
                    icon="pi pi-save"
                    tooltip="Save"
                    tooltipOptions={{ position: 'top' }}
                    className='mr-2'
                    onClick={this.save}></Button>
            )}
        </React.Fragment>
        )
    }

    renderWorkerSettings = (workerType) => {
        return (
            <WorkersSettings
                key={workerType}
                ref={this.workerSettings}
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
                        <InputFilesSelector ref={this.inputFilesSelector}></InputFilesSelector>
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