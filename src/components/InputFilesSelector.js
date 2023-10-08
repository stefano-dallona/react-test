import '../../node_modules/react-dropzone-component/styles/filepicker.css';
import '../css/basic.min.css'
import '../css/dropzone.min.css'

import React, { Component } from 'react';

import { DropzoneComponent } from 'react-dropzone-component';

import { PickList } from 'primereact/picklist';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import { ConfigurationService } from '../services/testbench-configuration-service'

class InputFilesSelector extends Component {

    constructor(props) {
        super(props);

        this.servicesContainer = props.servicesContainer
        this.baseUrl = this.servicesContainer.configurationService.baseUrl

        this.dropzoneConfig = {
            iconFiletypes: ['.wav'],
            showFiletypeIcon: true,
            postUrl: `${this.baseUrl}/upload`
        }

        this.djsConfig = {
            paramName: 'file',
            addRemoveLinks: true,
            chunking: true,
            forceChunking: true,
            maxFiles: 20,
            maxFilesize: 1025,
            chunkSize: 1000000,
            acceptedFiles: '.wav',
            headers: { "Authorization": localStorage.getItem("jwt_token") }
        }

        let _this = this
        this.dropzoneEventHandlers = {
            init: _this.dropzoneInit,
            addedfile: (file) => console.log(file),
            success: (file, response) => {
                _this.dropzone.removeFile(file)
            },
            uploadprogress: (file, progress, bytesSent) => {
                let progressPercentage = Math.min(Math.ceil(bytesSent / file.size * 100), 100)
                let progressElement = file.previewElement.querySelector("[data-dz-uploadprogress]");
                progressElement.style.width = progressPercentage + "%";
                console.log("file:" + file + ", progress:" + progressPercentage)

                if (file.upload.chunked && progressPercentage >= 100) {
                    this.loadInputFiles()
                    return;
                }
            },
            totaluploadprogress: null /*(progress) => {
                console.log("totaluploadprogress:" + progress)
            }*/
        }

        this.state = {
            availableInputFiles: [],
            selectedInputFiles: []
        }
    }

    async componentDidMount() {
        this.loadInputFiles()
    }

    loadInputFiles = async () => {
        let availableInputFiles = await this.servicesContainer.configurationService.getInputFiles()
        this.setAvailableInputFiles(availableInputFiles)
    }

    dropzoneInit = (dropzone) => {
        this.dropzone = dropzone
        this.dropzone._callbacks.uploadprogress = []
    }

    setAvailableInputFiles = (availableInputFiles) => {
        this.setState({
            availableInputFiles: availableInputFiles
        })
    }

    setSelectedInputFiles = (selectedInputFiles) => {
        this.setState({
            selectedInputFiles: selectedInputFiles
        })
    }

    onChange = (event) => {
        this.setAvailableInputFiles(event.source.sort());
        this.setSelectedInputFiles(event.target.sort());
    };

    render() {
        return (
            <div className="card">
                <Splitter>
                    <SplitterPanel size={50} className="flex align-items-center justify-content-center">
                        <DropzoneComponent config={this.dropzoneConfig}
                            djsConfig={this.djsConfig}
                            eventHandlers={this.dropzoneEventHandlers}
                            className="mb-2"></DropzoneComponent>
                    </SplitterPanel>
                    <SplitterPanel size={50} className="flex align-items-center justify-content-center">
                        <PickList source={this.state.availableInputFiles} target={this.state.selectedInputFiles} onChange={this.onChange} filter filterBy="name" breakpoint="1400px"
                            sourceHeader="Available" targetHeader="Selected" sourceStyle={{ height: '30rem' }} targetStyle={{ height: '30rem' }}
                            sourceFilterPlaceholder="Search by name" targetFilterPlaceholder="Search by name" />
                    </SplitterPanel>
                </Splitter>
            </div>
        )
    }

}

export default InputFilesSelector;