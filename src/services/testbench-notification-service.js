import axios from 'axios'
import { fetchEventSource } from '@microsoft/fetch-event-source'

export class NotificationService {

    constructor(baseUrl, axiosClient) {
        this.baseUrl = baseUrl;
        this.axiosClient = axiosClient
    }

    async findRunNotifications(run_ids) {
        let requestUrl = `${this.baseUrl}/notifications?rund_ids=${run_ids.join(",")}`
        let response = await this.axiosClient.get(requestUrl);
        let runs = response.data
        return runs
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
        let requestUrl = `${this.baseUrl}/runs/${run_id}/executions/${execution_id}/events?task_id=${task_id}`
        class RetriableError extends Error { }
        class FatalError extends Error { }

        let sseListenerController = new AbortController()
        
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
            signal: sseListenerController.signal
        })
        console.log("NotificationService: connected")
        return sseListenerController
    }

    stopListeningForExecutionEvents(sseListenerController) {
        if (sseListenerController) {
            console.log("NotificationService: disconnecting")
            sseListenerController.abort()
        }
    }

    async loadHelpPage(url) {
        let currenLocation = document.location.href.split("/")
        let currenPage = currenLocation[currenLocation.length - 1]
        currenPage = currenPage && currenPage.length > 0 ? currenPage : "index"
        let helpPageUrl = `${this.baseUrl.replace("https", "http").replace(":5000", ":3000")}/help/${currenPage}.html`
        //let helpPageUrl = `${this.baseUrl.replace("https", "http").replace(":5000", ":3000")}/help/index.html`
        //let helpPageUrl = `${this.baseUrl.replace("https", "http").replace(":5000", ":3000")}/help/history.html`
        //let helpPageUrl = `${this.baseUrl.replace("https", "http").replace(":5000", ":3000")}/help/configuration.html`
        //let helpPageUrl = `${this.baseUrl.replace("https", "http").replace(":5000", ":3000")}/help/execution.html`
        let response = await this.axiosClient.get(helpPageUrl);
        let helpPage = response.data
        return helpPage
    }

    async loadNotifications(run_ids) {
        let requestUrl = `${this.baseUrl}/notifications?run_ids=${run_ids}`
        let response = await this.axiosClient.get(requestUrl, { skipTracking: true });
        let notifications = response.data
        return notifications
    }
}