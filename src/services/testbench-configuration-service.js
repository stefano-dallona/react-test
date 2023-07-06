import axios from 'axios'
import { fetchEventSource } from '@microsoft/fetch-event-source'

function create_UUID() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
}

export class ConfigurationService {

    constructor(baseUrl, axiosClient) {
        this.baseUrl = baseUrl;
        this.axiosClient = axiosClient
    }

    async findAllRuns(pagination={page: 0, pageSize: -1}) {
        let requestUrl = `${this.baseUrl}/runs?page=${pagination.page}&page_size=${pagination.pageSize}`
        /*
        let response = await fetch(requestUrl, {
            headers: localStorage.getItem('jwt_token') ? { 'Authorization': `${localStorage.getItem('jwt_token')}` } : {}
        })
        let runs = await response.json()
        */
        let response = await this.axiosClient.get(requestUrl);
        let runs = response.data
        
        return runs
    }

    async findRunsByFilter(queryString, projection, pagination) {
        /*
        queryString = {
            "$and":[
                {
                    "filename": {
                    "$regex": ".*Musica.*"
                    },
                    "lostSamplesMasks.reconstructedTracks.outputAnalysis": {
                        "$elemMatch": {
                            "filename": {
                                "$regex": ".*MSECalculator.*"
                            }
                        }
                    }
                }
            ]
        }
        */
        projection = { }

        pagination = {
            "page": 0,
            "pageSize": 10
        }

        const requestOptions = {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                queryString: queryString,
                projectionString: projection,
                pagination: pagination
            })
        };
        let requestUrl = this.baseUrl + `/runs/searches`
        /*
        let response = await fetch(requestUrl, requestOptions).catch((error) => {
            console.log(error)
        })
        if (response.ok) {
            let responseBody = await response.json()
            console.log("responseBody: " + JSON.stringify(responseBody))
            return responseBody
        } else {
            return null
        }
        */
        let response = await this.axiosClient.post(requestUrl, requestOptions)
        if (response?.status == 200) {
            let responseBody = response.data
            console.log("responseBody: " + JSON.stringify(responseBody))
            return responseBody
        } else {
            return null
        }
    }

    async saveRunConfiguration(configuration) {
        let requestOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(configuration)
        };
        let requestUrl = this.baseUrl + `/runs`
        /*
        let response = await fetch(requestUrl, requestOptions).catch((error) => {
            console.log(error)
        })
        if (response.ok) {
            let responseBody = await response.json()
            console.log("saveRunConfiguration: run_id: " + responseBody.run_id)
            return responseBody.run_id
        } else {
            return null
        }
        */
        let response = await this.axiosClient.post(requestUrl, requestOptions)
        if (response?.status == 200) {
            let responseBody = response.data
            console.log("saveRunConfiguration: run_id: " + responseBody.run_id)
            return responseBody.run_id
        } else {
            return null
        }
    }

    async launchRunExecution(run_id) {
        const requestOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            }
        };
        let requestUrl = this.baseUrl + "/runs/" + run_id + "/executions"
        /*
        let response = await fetch(requestUrl, requestOptions)
        let run_execution = await response.json()
        */
        let response = await this.axiosClient.post(requestUrl, requestOptions)
        let run_execution = response.data
        return run_execution
    }

    startListeningForExecutionEvents(run_id,
            execution_id,
            callback,
            error_callback = (err) => { console.error("EventSource failed:", err) }) {
        let token = localStorage.getItem("jwt_token")                
        let requestUrl = `${this.baseUrl}/runs/${run_id}/executions/${execution_id}/events` //?token=${token}`
        /*
        this.sseListener = new EventSource(requestUrl, { authorizationHeader: localStorage.getItem("jwt_token") });
        this.sseListener.addEventListener("run_execution", callback)
        this.sseListener.onerror = error_callback
        */
        
        fetchEventSource(requestUrl, {
            headers: {
                'Authorization': localStorage.getItem("jwt_token"),
            },
            onmessage(msg) {
                if (msg.event === 'run_execution') {
                    callback(msg)
                }
            },
            onerror(err) {
                error_callback(err)
            }
        })
        
    }

    stopListeningForExecutionEvents() {
        if (this.sseListener) {
            this.sseListener.close();
        }
    }

    async getRunHierarchy(run_id, audio_file) {
        //let requestUrl = this.baseUrl + "/output_hierarchy?run_id=" + run_id + "&filename=" + audio_file
        let execution_id = run_id
        let requestUrl = this.baseUrl + `/runs/${run_id}/executions/${execution_id}/hierarchy`
        /*
        let response = await this.axiosClient.get(requestUrl);
        let run_hierarchy = await response.json()
        */
        let response = await this.axiosClient.get(requestUrl)
        let run_hierarchy = response.data
        return run_hierarchy.find((node) => node.file.endsWith(audio_file))
    }

    async getSettingsMetadata() {
        let requestUrl = this.baseUrl + "/settings_metadata"
        /*
        let response = await fetch(requestUrl)
        let settings_metadata = await response.json()
        */
        let response = await this.axiosClient.get(requestUrl);
        let settings_metadata = response.data
        return settings_metadata
    }

    async getLossSimulators() {
        let requestUrl = this.baseUrl + "/loss_simulators"
        /*
        let response = await fetch(requestUrl)
        let loss_simulators = await response.json()
        */
        let response = await this.axiosClient.get(requestUrl)
        let loss_simulators = response.data
        return loss_simulators
    }

    async getLossModels() {
        let requestUrl = this.baseUrl + "/loss_models"
        /*
        let response = await fetch(requestUrl)
        let loss_models = await response.json()
        */
        let response = await this.axiosClient.get(requestUrl)
        let loss_models = response.data
        return loss_models
    }

    async getEccAlgorithms() {
        let requestUrl = this.baseUrl + "/ecc_algorithms"
        /*
        let response = await fetch(requestUrl)
        let ecc_algorithms = await response.json()
        */
        let response = await this.axiosClient.get(requestUrl)
        let ecc_algorithms = response.data
        return ecc_algorithms
    }

    async getOutputAnalysers(category = null) {
        let requestUrl = this.baseUrl + `/output_analysers?${category ? "category=" + category : ""}`
        /*
        let response = await fetch(requestUrl)
        let output_analysers = await response.json()
        */
        let response = await this.axiosClient.get(requestUrl)
        let output_analysers = response.data

        return output_analysers
    }

    async getInputFiles(path) {
        let requestUrl = this.baseUrl + "/input_files?path=" + path
        /*
        let response = await fetch(requestUrl)
        let input_files = await response.json()
        */
        let response = await this.axiosClient.get(requestUrl)
        let input_files = response.data
        return input_files
    }

    async getRun(run_id) {
        let requestUrl = `${this.baseUrl}/runs/${run_id}`
        /*
        let response = await fetch(requestUrl)
        let run = await response.json()
        */
        let response = await this.axiosClient.get(requestUrl)
        let run = response.data
        return run
    }

}