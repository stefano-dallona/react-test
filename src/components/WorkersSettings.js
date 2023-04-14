import React, { Component } from 'react';

import { Panel } from 'primereact/panel';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { ListBox } from 'primereact/listbox';


import cloneDeep from 'lodash/cloneDeep';
import create_UUID from '../utils/Uuid';

class WorkersSettings extends Component {

    constructor(props) {
        super(props);

        this.toast = props.toast
        this.workerType = props.workerType
        this.defaultSettings = props.defaultSettings || {}

        this.header = props.header || this.workerType + " Settings"
        this.toggleable = props.toggleable || true

        this.state = {
            currentWorker: null,
            currentWorkerSettings: null,
            selectedWorkers: []
        };
    }

    componentDidMount() {
        if (this.defaultSettings.length == 1) {
            this.setCurrentWorker(this.defaultSettings[0].name)
        }
    }

    setCurrentWorker(currentWorker) {
        this.setState({
            currentWorker: currentWorker
        })

        let workersSettings = this.defaultSettings.find((worker) => worker.name == currentWorker)
        if (workersSettings) {
            workersSettings.uuid = create_UUID()
        }
        this.setCurrentWorkerSettings(cloneDeep(workersSettings))
    }

    setCurrentWorkerSettings(currentWorkerSettings) {
        this.setState({
            currentWorkerSettings: currentWorkerSettings
        })
    }

    setSelectedWorkers(selectedWorkers) {
        this.setState({
            selectedWorkers: selectedWorkers
        })
    }

    setPropertyValue = (setting, value) => {
        let currentWorkerSettings = cloneDeep(this.state.currentWorkerSettings)
        currentWorkerSettings.settings.map((originalSetting) => {
            if (originalSetting.property == setting.property) {
                originalSetting.value = value
                return originalSetting
            } else {
                return originalSetting
            }
        })
        this.setState({ currentWorkerSettings: currentWorkerSettings })
    };

    getWorkers = () => {
        let workers = this.defaultSettings.map((worker) => worker.name)
        return workers
    }

    saveWorker = () => {
        if (!this.state.currentWorker) return;

        let clonedSelectedWorkers = cloneDeep(this.state.selectedWorkers)
        let currentWorker = cloneDeep(this.state.currentWorkerSettings)
        let existingWorker = this.state.selectedWorkers.find(oa => oa.uuid == currentWorker.uuid)
        if (existingWorker) {
            clonedSelectedWorkers = clonedSelectedWorkers.map(oa => (oa.uuid == currentWorker.uuid) ? currentWorker : oa)
        } else {
            clonedSelectedWorkers.push(currentWorker)
        }
        this.setSelectedWorkers(clonedSelectedWorkers)

        if (this.defaultSettings.length > 1) {
            this.setCurrentWorker(null)
        }

        this.showMessage('info', `Settings saved !`, JSON.stringify(this.state.selectedOutputAnalysers))
    }

    showMessage = (severity, summary, detail) => {
        if (this.toast && this.toast.current)
            this.toast.current.show({ severity: severity, summary: summary, detail: detail });
    }

    deleteWorker = () => {
        if (!this.state.currentWorker) return;
        let currentWorkerSettings = this.state.currentWorkerSettings
        if (this.state.selectedWorkers) {
            this.setSelectedWorkers(this.state.selectedWorkers.filter((oa) => (oa.uuid != currentWorkerSettings.uuid)))
            this.setCurrentWorker(null)
        }
    }

    loadSelectedWorker = (value) => {
        let currentWorker = this.state.selectedWorkers.find((oa) => oa.uuid == value)
        if (currentWorker) {
            this.setCurrentWorker(currentWorker.name)
            this.setCurrentWorkerSettings(currentWorker)
        }
    }


    cellEditor = (setting) => {
        let editor = null
        switch (setting.type) {
            case "int":
                editor = this.numberEditor(setting)
                break;
            case "float":
                editor = this.numberEditor(setting)
                break;
            case "select":
                editor = this.sinleSelectEditor(setting)
                break;
            case "multiselect":
                editor = this.sinleSelectEditor(setting)
                break;
            default:
                editor = this.textEditor(setting)
        }
        return editor;
    };

    numberEditor = (setting) => {
        return <InputNumber key={setting.property} type="text" value={setting.value} onChange={(e) => this.setPropertyValue(setting, e.value)} />;
    };

    textEditor = (setting) => {
        return <InputText key={setting.property} type="text" value={setting.value} onChange={(e) => this.setPropertyValue(setting, e.target.value)} />;
    };

    multipleSelectEditor = (setting) => {
        return <MultiSelect key={setting.property} value={setting.value} options={setting.options} optionGroupChildren="items" display="chip" style={{ textAlign: "left" }} onChange={(e) => this.setPropertyValue(setting, e.value)} />
    }

    sinleSelectEditor = (setting) => {
        return <Dropdown key={setting.property} value={setting.value} options={setting.options} style={{ textAlign: "left" }} onChange={(e) => this.setPropertyValue(setting, e.value)} />
    }

    render() {
        return (
            <div className="card p-fluid">
                <Panel header={this.header} toggleable={this.toggleable}>
                    {this.defaultSettings.length > 1 && (
                        <div className="p-inputgroup">
                            <label style={{ textAlign: 'left', color: 'white', width: '20%' }}>Algorithm</label>
                            <Dropdown value={this.state.currentWorker} onChange={(e) => this.setCurrentWorker(e.target.value)} options={this.getWorkers()}
                                placeholder={this.workerType} className="w-full md:w-14rem" />
                        </div>
                    )}
                    {this.state.currentWorkerSettings && this.state.currentWorkerSettings.settings.map((setting) => {
                        return (
                            <div key={"group-" + setting.property} className="p-inputgroup">
                                <label key={"label-" + setting.property} htmlFor={setting.property} style={{ textAlign: 'left', color: 'white', width: '20%' }}>{setting.property}</label>
                                {this.cellEditor(setting)}
                            </div>
                        )
                    })}
                    <div className="p-inputgroup">
                        <Button className="mr-2" onClick={(e) => this.saveWorker()}>Save</Button>
                        {this.defaultSettings.length > 1 && (
                            <Button className="mr-2" onClick={(e) => this.deleteWorker()}>Delete</Button>
                        )}
                    </div>
                    {this.defaultSettings.length > 1 && (
                        <ListBox value={this.state.selectedWorkers} onChange={(e) => this.loadSelectedWorker(e.value)} options={this.state.selectedWorkers} optionValue="uuid" optionLabel="name" className="mt-2" style={{ textAlign: "left", width: "100%" }} />
                    )}
                </Panel>
            </div>
        )
    }
}

export default WorkersSettings;