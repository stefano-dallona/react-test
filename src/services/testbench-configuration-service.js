import axios from 'axios'
import { fetchEventSource } from '@microsoft/fetch-event-source'

export class ConfigurationService {

    constructor(baseUrl, axiosClient) {
        this.baseUrl = baseUrl;
        this.axiosClient = axiosClient
        this.sseListenerController = null;
    }

    create_UUID() {
        var dt = new Date().getTime();
        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (dt + Math.random() * 16) % 16 | 0;
            dt = Math.floor(dt / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    }

    async findAllRuns(pagination = { page: 0, pageSize: -1 }) {
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
        projection = {}

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

    async launchRunExecution(run_id, task_id) {
        const requestOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: {
                'task_id': task_id
            }
        };
        let requestUrl = this.baseUrl + "/runs/" + run_id + "/executions"
        /*
        let response = await fetch(requestUrl, requestOptions)
        let run_execution = await response.json()
        */
        let response = await this.axiosClient.post(requestUrl, requestOptions)
        let executionId = response.data
        return executionId
    }

    /*
    https://www.npmjs.com/package/@microsoft/fetch-event-source
     "this library also plugs into the browser's Page Visibility API
     so the connection closes if the document is hidden (e.g., the
     user minimizes the window), and automatically retries with the
     last event ID when it becomes visible again. This reduces the
     load on your server by not having open connections unnecessarily
     (but you can opt out of this behavior if you want.)"
    */
    startListeningForExecutionEvents(run_id,
        execution_id,
        callback,
        task_id,
        error_callback = (err) => { console.error("EventSource failed:", err) }) {
        let token = localStorage.getItem("jwt_token")
        let requestUrl = `${this.baseUrl}/runs/${run_id}/executions/${execution_id}/events?task_id=${task_id}` //&token=${token}`
        /*
        this.sseListener = new EventSource(requestUrl, { authorizationHeader: localStorage.getItem("jwt_token") });
        this.sseListener.addEventListener("run_execution", callback)
        this.sseListener.onerror = error_callback
        */
        class RetriableError extends Error { }
        class FatalError extends Error { }

        this.sseListenerController = new AbortController()

        fetchEventSource(requestUrl, {
            openWhenHidden: true,
            headers: {
                'Authorization': token,
            },
            onmessage(msg) {
                if (msg.event === 'run_execution') {
                    callback(msg)
                }
            },
            onclose() {
                // if the server closes the connection unexpectedly, retry:
                throw new RetriableError();
            },
            onerror(err) {
                error_callback(err)
                if (err instanceof FatalError) {
                    throw err; // rethrow to stop the operation
                } else if (err instanceof FatalError) {
                    throw err;
                } else {
                    // do nothing to automatically retry. You can also
                    // return a specific retry interval here.
                }
            },
            signal: this.sseListenerController.signal
        })

    }

    stopListeningForExecutionEvents() {
        /*
        if (this.sseListener) {
            this.sseListener.close();
        }
        */
        if (this.sseListenerController) {
            this.sseListenerController.abort()
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


    async refreshSettingsMetadata(settings_list = null, modified_setting = null, new_value = null) {
        let options = {
            "headers": {'Content-Type': 'application/json'},
            "params": {
                "modified_setting": modified_setting,
                "new_value": new_value
            }
        }
        let requestUrl = this.baseUrl + "/settings_metadata"
        /*
        let response = await fetch(requestUrl)
        let settings_metadata = await response.json()
        */
        let requestBody = settings_list ? JSON.stringify(settings_list) : settings_list
        let response = await this.axiosClient.put(requestUrl, requestBody, options);
        let settings_metadata = response.data[0].value[0].settings
        return settings_metadata
    }

    async validateSettings(settings_list = null) {
        let options = {
            "headers": {'Content-Type': 'application/json'}
        }
        let requestUrl = this.baseUrl + "/settings/validate"
        let requestBody = settings_list ? JSON.stringify(settings_list) : settings_list
        let response = await this.axiosClient.put(requestUrl, requestBody, options);
        let result = response.data

        return result
    }

    async getSettingsMetadata(settings_list = null, modified_setting = null, new_value = null) {
        let options = {
            "headers": {
                "settings_list": settings_list ? JSON.stringify(settings_list) : settings_list
            },
            "params": {
                "modified_setting": modified_setting,
                "new_value": new_value
            }
        }
        let requestUrl = this.baseUrl + "/settings_metadata"
        /*
        let response = await fetch(requestUrl)
        let settings_metadata = await response.json()
        */
        let response = await this.axiosClient.get(requestUrl, options);
        let settings_metadata = response.data
        return settings_metadata
    }

    getSettingsAsTreetableNodes(settings, path = []) {
        return settings.flatMap((property, index) => {
            let itemPath = [...path, [index]]

            if (["settingsList"].includes(property.valueType)) {
                return {
                    "key": itemPath.join("-"),
                    "data": {
                        "property": property.property,
                        "value": "",
                        "valueType": property.valueType,
                        "editable": property.editable,
                        "is_modifier": property.is_modifier || false
                    },
                    "children": property.value.map((child, childIndex) => {
                            let childPath = [...itemPath, [childIndex]]
                            let childChildren = this.getSettingsAsTreetableNodes(child.settings, childPath)
                            return {
                                "key": childPath.join("-"),
                                "data": {
                                    "property": `band-${childIndex}`,
                                    "value": child.name,
                                    "valueType": "select",
                                    "options": child.options.map((item, index) => {
                                        return {
                                            "name": item.name,
                                            "settings": this.getSettingsAsTreetableNodes(item.settings, childPath)
                                        }
                                    }),
                                    "editable": true,
                                    "mandatory": true
                                },
                                "children": childChildren
                            }
                        })
                }
            }

            if (["dictionary"].includes(property.valueType)) {
                return {
                    "key": itemPath.join("-"),
                    "data": {
                        "property": property.property,
                        "value": "",
                        "valueType": property.valueType,
                        "editable": property.editable,
                        "mandatory": true,
                        "is_modifier": property.is_modifier || false
                    },
                    "children": property.value
                        .flatMap((child, childIndex) => {
                            return this.getSettingsAsTreetableNodes([child], itemPath)
                        })
                }
            }

            if (["select"].includes(property.valueType)) {
                return {
                    key: itemPath.join("-"),
                    data: {
                        "property": property.property,
                        "value": property.value,
                        "options": property.options.map((option) => { return { name: option } }),
                        "valueType": property.valueType,
                        "editable": property.editable,
                        "mandatory": true,
                        "is_modifier": property.is_modifier || false
                    }
                }
            }

            return {
                key: itemPath.join("-"),
                data: {
                    "property": property.property,
                    "value": property.value?.toString(),
                    "valueType": property.valueType,
                    "nestedType": property.nestedType,
                    "editable": property.editable,
                    "mandatory": true,
                    "is_modifier": property.is_modifier || false
                }
            }
        })
    }

    async getSearchFields() {
        let requestUrl = this.baseUrl + "/search_fields"
        /*
        let response = await fetch(requestUrl)
        let settings_metadata = await response.json()
        */
        let response = await this.axiosClient.get(requestUrl);
        let search_fields = response.data
        return search_fields
    }

    async getFilters() {
        let requestUrl = this.baseUrl + `/filters`
        let response = await this.axiosClient.get(requestUrl)
        let filters = response.data
        return filters
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

    async getOutputAnalysers(category = null, runId = null) {
        let requestUrl = this.baseUrl + `/output_analysers?${category ? "&category=" + category : ""}${runId ? "&runId=" + runId : ""}`
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
        let response = await this.axiosClient.get(requestUrl)
        let run = response.data
        return run
    }

    async getRunConfiguration(run_id) {
        let requestUrl = `${this.baseUrl}/runs/${run_id}/configuration`
        let response = await this.axiosClient.get(requestUrl)
        let run_configuration = response.data
        return run_configuration
    }

    async saveFilter(name, query) {
        let requestUrl = this.baseUrl + `/filters`
        const requestOptions = {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: {
                'name': name,
                'query': query
            }
        };
        let response = await this.axiosClient.post(requestUrl, requestOptions)
        let filter = response.data
        return filter
    }

    async deleteFilter(filter_id) {
        let requestUrl = `${this.baseUrl}/filters/${filter_id}`
        let response = await this.axiosClient.delete(requestUrl)
        let result = response.data
        return result
    }

    async deleteRunNode(run_id, node_id) {
        let requestUrl = `${this.baseUrl}/runs/${run_id}/nodes/${node_id}`
        let response = await this.axiosClient.delete(requestUrl)
        let result = response.data
        return result
    }

}