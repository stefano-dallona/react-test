import { React, useState, useEffect, useRef } from 'react';

import { Menubar } from 'primereact/menubar';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';
import { ScrollPanel } from 'primereact/scrollpanel';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Messages } from 'primereact/messages';
import { useMountEffect } from 'primereact/hooks';

import { GoogleLogin, googleLogout, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { useNavigate } from "react-router";

import { useContainer } from "../components/ServicesContextProvider"
import { Fragment } from 'react';

import NotificationMenu from "../components/NotificationMenu"

var parse = require('html-react-parser');


const Navigation = (props) => {
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();
    const servicesContainer = useContainer();
    const overlayPanelRef = useRef(null);
    const messagesRef = useRef(null);
    const [messages, setMessages] = useState([]);
    const [helpPage, setHelpPage] = useState("");
    const [sidebarFullScreen, setSidebarFullScreen] = useState(false);

    const login = useGoogleLogin({
        onSuccess: (codeResponse) => {
            setUser(codeResponse)
            localStorage.setItem('access_token', user.access_token);
        },
        onError: (error) => {
            console.log('Login Failed:', error)
        }
    });

    const responseMessage = (response) => {
        console.log(response);
        const userObject = jwtDecode(response.credential);
        setUser(userObject)
        setProfile(userObject);
        localStorage.setItem('user', JSON.stringify(userObject));
        localStorage.setItem('jwt_token', response.credential);
    };
    const errorMessage = (error) => {
        console.log(error);
    };

    const getMessages = () => {
        return messages
    }

    // log out function to log the user out of google and set the profile array to null
    const logOut = () => {
        googleLogout();
        localStorage.removeItem('user')
        localStorage.removeItem('jwt_token');
        setProfile(null);
        window.location.href = "/"
    };

    useEffect(
        () => {
            if (user) {
                axios
                    .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
                        headers: {
                            Authorization: `Bearer ${user.access_token}`,
                            Accept: 'application/json'
                        }
                    })
                    .then((res) => {
                        setProfile(res.data);
                    })
                    .catch((err) => {
                        console.log(err)
                    });
            }
        },
        [user]
    );

    useMountEffect(() => {
        let msgs = [{
            sticky: true, uuid: "a", content: "Message Content", severity: "success", buttonSeverity: "success", content: (
                <Fragment>
                    <div className="ml-2" onClick={(e) => { console.log(e.target) }}><a href={"/run/history"}>Message Content</a></div>
                </Fragment>
            )
        },
        { sticky: true, uuid: "b", content: "Message Content", severity: "warn", buttonSeverity: "warning" },
        { sticky: true, uuid: "c", content: "Message Content", severity: "error", buttonSeverity: "danger" },
        { sticky: true, uuid: "d", content: "Message Content", severity: "info", buttonSeverity: "info" }]
        /*
        msgs = msgs.map((message) => {
            return {
                sticky: true, uuid: message.uuid, severity: message.severity, closable: false, content: (
                    <Fragment>
                        <div uuid={message.uuid} onClick={(e) => console.log(e.target.uuid)} className="ml-2">{message.content}</div>
                        <Button
                            rounded
                            tooltip="Delete"
                            tooltipOptions={{ position: 'top' }}
                            icon="pi pi-times"
                            className="mr-2"
                            severity={message.buttonSeverity}
                            onClick={(e) => {
                                console.log(message.uuid)
                                removeMessage(message.uuid)
                                if (message.length == 0) {
                                    overlayPanelRef.current.hide()
                                }
                            }}
                            style={{ position: "relative", left: "60%" }}></Button>
                    </Fragment>
                )
            }
        })
        */
        setMessages(msgs)
    })

    useEffect(
        () => {
            let progressCallback = async function (e) {
                let message = JSON.parse(e.data)
                console.log(`notification received:${message}`)
            }
            let run_id = "123"
            let task_id = "123"
            //let sseListenerController = servicesContainer.notificationService.startListeningForExecutionEvents(run_id, run_id, progressCallback.bind(this), task_id)

            return () => {
                //servicesContainer.notificationService.stopListeningForExecutionEvents(sseListenerController)
            }
        }
    );

    const navlist = [
        {
            label: '', icon: 'pi pi-bars', command: () => {
                setSidebarVisible(true)
            }
        },
        {
            label: 'History', icon: 'pi pi-fw pi-history', command: () => {
                navigate('/run/history')
                window.location.href = '/run/history';
            }
        },
        {
            label: 'Configuration', icon: 'pi pi-fw pi-sitemap', command: () => {
                window.location.href = '/run/configuration';
            }
        },
        {
            label: 'Execution', icon: 'pi pi-fw pi-cog', command: () => {
                window.location.href = '/run/execution'
            }
        },
        {
            label: 'Analysis', icon: 'pi pi-bw pi-chart-bar', command: () => {
                window.location.href = '/run/analysis'
            }
        },
        /*{
            label: 'Run Analysis 2', icon: 'pi pi-bw pi-chart-bar', command: () => {
                window.location.href = '/run/analysis2'
            }
        }*/
    ]

    const getCurrentUser = () => {
        return localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : { "name": "" }
    }

    const toggleMessages = (sourceEvent) => {
        if (messages.length > 0) {
            overlayPanelRef.current.toggle(sourceEvent)
        }
    }

    const removeMessage = (item) => {
        let newMessages = getMessages().filter((message) => {
            return message !== item
        })
        setMessages(newMessages)
    }

    const loadHelpPage = async (url) => {
        let helpPage = await servicesContainer.notificationService.loadHelpPage(url)
        return helpPage
    }

    const customIcons = (
        <Fragment>
            <button style={{display: (!sidebarFullScreen) ? "" : "none"}} className="p-sidebar-icon p-link mr-2"
                onClick={(e) => { setSidebarFullScreen(true) }}>
                <span className="pi pi-window-maximize" />
            </button>
            <button style={{display: (sidebarFullScreen) ? "" : "none"}} className="p-sidebar-icon p-link mr-2"
                onClick={(e) => { setSidebarFullScreen(false) }}>
                <span className="pi pi-window-minimize" />
            </button>
        </Fragment>
    );

    const end = <>
        {!localStorage.getItem('user') && (
            /*<button onClick={() => login()}>Sign in with Google 🚀 </button>*/
            <Button rounded className="mr-2">
                <GoogleLogin size='small' width={20} type='icon' shape='circle' theme='filled_blue' onSuccess={responseMessage} onError={errorMessage} />
            </Button>
        )}
        {localStorage.getItem('user') && (
            <Button
                rounded
                tooltip={getCurrentUser()["name"] + "\n User Profile "}
                tooltipOptions={{ position: 'top' }}
                className={"pi mr-2 " + (!JSON.parse(localStorage.getItem('user')).picture ? "pi-user" : "")}
                style={{ height: 37, width: 37, padding: 0, borderRadius: "50%" }}>
                <img
                    referrerPolicy="no-referrer"
                    className='custom-target-icon'
                    size='small'
                    alt={localStorage.getItem('user').email}
                    style={{ height: 37, borderRadius: "50%" }}
                    src={JSON.parse(localStorage.getItem('user')).picture ? JSON.parse(localStorage.getItem('user')).picture : ""}
                    onClick={() => { window.location.href = '/userprofile' }}
                />
            </Button>
        )}
        {false && (<>
            <Button
                rounded
                tooltip="Notifications"
                tooltipOptions={{ position: 'top' }}
                icon="pi pi-bell"
                className="mr-2"
                onClick={(e) => {
                    toggleMessages(e)
                }}
                style={{ height: 39 }}>
                <Badge
                    value={messages.length}
                    severity="info"></Badge>
            </Button>
            <OverlayPanel ref={overlayPanelRef} messages={messages}
                style={{ width: "30rem", alignContent: "right" }}
                onShow={() => {
                    if (messagesRef.current && getMessages().length > 0) {
                        messagesRef.current.show(getMessages());
                    }
                }}>
                <Messages ref={messagesRef} onRemove={(item) => {
                    console.log("Remove:" + item)
                    if (messages.length === 1) {
                        overlayPanelRef.current.hide()
                    }
                    removeMessage(item)
                }} />
                <Button
                    rounded
                    tooltip="Clear all"
                    tooltipOptions={{ position: 'top' }}
                    icon="pi pi-trash"
                    severity='danger'
                    className="mr-2"
                    onClick={() => {
                        if (overlayPanelRef.current) {
                            setMessages([])
                            messagesRef.current.clear()
                            overlayPanelRef.current.hide()
                        }
                    }}></Button>
            </OverlayPanel>
        </>
        )}
        <NotificationMenu filter={[]} servicesContainer={servicesContainer}></NotificationMenu>
        <Button
            rounded
            tooltip="Log out"
            tooltipOptions={{ position: 'top' }}
            icon="pi pi-fw pi-power-off"
            severity='warning'
            className="mr-2"
            onClick={logOut}></Button>
    </>

    return (
        <div>
            <Menubar
                model={navlist}
                end={end}
            />
            <Sidebar visible={sidebarVisible}
                fullScreen={sidebarFullScreen}
                icons={customIcons}
                onShow={async () => {
                    let helpPage = await loadHelpPage()
                    setHelpPage(helpPage)
                }}
                onHide={() => setSidebarVisible(false)}>
                <ScrollPanel style={{ width: '100%', height: '100%', textAlign: 'justify' }} className="custombar1">
                    {(<div>{parse(helpPage)}</div>)}
                </ScrollPanel>
            </Sidebar>
        </div>
    )
}
export default Navigation;