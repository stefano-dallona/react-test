import React, { Component, Fragment, setState, useEffect } from 'react';

import { Menubar } from 'primereact/menubar';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { ScrollPanel } from 'primereact/scrollpanel';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Messages } from 'primereact/messages';
import { useMountEffect } from 'primereact/hooks';

import EventBus from '../services/event-bus'

class NotificationMenu extends Component {

    constructor(props) {
        super(props)

        this.filter = props.filter || []
        this.servicesContainer = props.servicesContainer
        this.overlayPanelRef = React.createRef(null);
        this.messagesRef = React.createRef(null);
        this.sseListenerController = null
        this.notificationsPollingInterval = null

        this.state = {
            messages: []
        }
    }

    notificationListener() {

    }

    componentCleanup() {
        this.stopNotificationPolling()
        this.servicesContainer.notificationService.stopListeningForExecutionEvents(this.sseListenerController)
    }

    async updateNotifications() {
        let run_ids = JSON.parse(localStorage.getItem("pendingElaborations"))
        let messages = await this.servicesContainer.notificationService.loadNotifications(run_ids)
        this.addMessages(messages)

        //FIXME - 
        if (document.location.href.endsWith('/run/history')) {
            let notified_runs = messages.filter((message) => {
                return message.text.match(/Run '(\d+)'/ig)
            }).map((message) => {
                let runId = /Run '(\d+)'/ig.exec(message.text)[1]
                let status = message.text.indexOf('completed successfully') !== -1 ? 'COMPLETED' : 'FAILED'
                return {
                    "runId": runId,
                    "status": status
                }
            })
            notified_runs.forEach(run => {
                EventBus.dispatch("runCompleted", { "runId": run.runId, "status": run.status })
            })
        }
    }

    startNotificationPolling() {
        this.notificationsPollingInterval = setInterval(() => {
            this.updateNotifications()
        }, 5000)
        console.log("Notification polling started")
    }

    stopNotificationPolling() {
        if (this.notificationsPollingInterval) {
            clearInterval(this.notificationsPollingInterval)
        }
        console.log("Notification polling stopped")
    }

    async componentDidMount() {
        window.addEventListener('beforeunload', this.componentCleanup.bind(this));
        /*let messages = [
            { uuid: "a", text: "Message Content", severity: "success" },
            { uuid: "b", text: "Message Content", severity: "warn" },
            { uuid: "c", text: "Message Content", severity: "error" },
            { uuid: "d", text: "Message Content", severity: "info" }
        ]*/
        /*
        localStorage.setItem("pendingElaborations", JSON.stringify(["49557303196154904", "49557303196154904"]))
        */
        this.startNotificationPolling()

        let pendingElaboration = {
            run_id: "49557303196154904",
            execution_id: "49557303196154904",
            task_id: "49557303196154904"
        }
        this.sseListenerController = this.servicesContainer.notificationService.startListeningForExecutionEvents(pendingElaboration.run_id,
            pendingElaboration.run_id, this.notification_listener, pendingElaboration.task_id)
    }

    componentWillUnmount() {
        this.componentCleanup();
        window.removeEventListener('beforeunload', this.componentCleanup);
    }

    setMessages(messages, callback = () => { }) {
        this.setState({
            messages: messages
        }, callback)
    }

    toggleMessages(sourceEvent) {
        if (this.state.messages.length > 0) {
            this.overlayPanelRef.current.toggle(sourceEvent)
        }
    }

    addMessages(messages) {
        const getButtonSeverity = (severity) => {
            let buttonSeverity = null
            switch (severity) {
                case "warn":
                    buttonSeverity = "warning"
                    break;
                case "error":
                    buttonSeverity = "danger"
                    break;
                default:
                    buttonSeverity = severity
            }
            return buttonSeverity
        }

        let decoratedMessages = messages.map((message) => {
            return {
                ...message, sticky: true, buttonSeverity: getButtonSeverity(message.severity), content: (
                    <Fragment>
                        <div className="ml-2" onClick={(e) => { console.log(e.target) }}>{message.text}</div>
                    </Fragment>
                )
            }
        })
        this.setMessages(decoratedMessages)
    }

    removeFromPendingElaborations(runId) {
        let pendingElaborations = JSON.parse(localStorage.getItem("pendingElaborations"))
        localStorage.setItem("pendingElaborations", JSON.stringify(pendingElaborations.filter((run_id) => { return run_id !== runId })))
    }

    removeMessage(item) {
        this.removeFromPendingElaborations(item.uuid)

        let newMessages = this.state.messages.filter((message) => {
            return message !== item
        })
        this.setMessages(newMessages)
    }

    render() {
        return (<Fragment>
            <Button
                rounded
                tooltip="Notifications"
                tooltipOptions={{ position: 'top' }}
                icon="pi pi-bell"
                className="mr-2"
                onClick={(e) => {
                    this.toggleMessages(e)
                }}
                style={{ height: 39 }}>
                <Badge
                    value={this.state.messages.length}
                    severity="info"></Badge>
            </Button>
            <OverlayPanel ref={this.overlayPanelRef} messages={this.state.messages}
                style={{ width: "30rem", alignContent: "right" }}
                onShow={() => {
                    if (this.messagesRef.current && this.state.messages.length > 0) {
                        this.messagesRef.current.show(this.state.messages);
                    }
                }}>
                <Messages ref={this.messagesRef} onRemove={(item) => {
                    console.log("Remove:" + item)
                    if (this.state.messages.length === 1) {
                        this.overlayPanelRef.current.hide()
                    }
                    this.removeMessage(item)
                }} />
                <Button
                    rounded
                    tooltip="Clear all"
                    tooltipOptions={{ position: 'top' }}
                    icon="pi pi-trash"
                    severity='danger'
                    className="mr-2"
                    onClick={() => {
                        if (this.overlayPanelRef.current) {
                            this.setMessages([])
                            this.messagesRef.current.clear()
                            this.overlayPanelRef.current.hide()
                        }
                    }}></Button>
            </OverlayPanel>
        </Fragment>)
    }
}

export default NotificationMenu;