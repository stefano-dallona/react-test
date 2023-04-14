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
        this.inputFilesSelector = React.createRef();
        this.workerSettings = React.createRef();

        this.paged = props.paged || true

        this.pages = ["Input File Selection", "GlobalSettings", "PlsAlgorithm", "PlcAlgorithm", "OutputAnalyser"]

        this.defaultSettings = defaultSettings
        this.storedSettings = []

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

        if (this.getCurrentPageName() == "Input File Selection") {
            if (this.getPageSettings().length == 0)
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

    getPageSettings = () => {
        if (this.state.currentPage == 0)
            return this.inputFilesSelector.current.state.selectedInputFiles
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
        if (! success) {
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

    save = () => {
        let [success, errors] = this.storeSettings()
        if (success)
            this.toast.current.show({ severity: 'info', summary: JSON.stringify(this.state.selectedOutputAnalysers), detail: 'Run configuration saved!' });
        else
            errors.forEach((error) => this.showMessage('error', error, ""))
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