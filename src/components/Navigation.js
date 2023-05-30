import { React, useState, useEffect } from 'react';

import { Menubar } from 'primereact/menubar';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';

import { GoogleLogin, googleLogout, useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import jwtDecode from 'jwt-decode';


const Navigation = (props) => {
    const [sidebarVisible, setSidebarVisible] = useState(false);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);

    const login = useGoogleLogin({
        onSuccess: (codeResponse) => {
            setUser(codeResponse)
            localStorage.setItem('token', user.access_token);
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

    const navlist = [
        {
            label: '', icon: 'pi pi-bars', command: () => {
                setSidebarVisible(true)
            }
        },
        {
            label: 'Run History', icon: 'pi pi-fw pi-history', command: () => {
                window.location.href = '/run/history';
            }
        },
        {
            label: 'Run Configuration', icon: 'pi pi-fw pi-sitemap', command: () => {
                window.location.href = '/run/configuration';
            }
        },
        {
            label: 'Run Execution', icon: 'pi pi-fw pi-cog', command: () => {
                window.location.href = '/run/execution'
            }
        },
        {
            label: 'Run Analysis', icon: 'pi pi-bw pi-chart-bar', command: () => {
                window.location.href = '/run/analysis'
            }
        }
    ]

    const getCurrentUser = () => {
        return localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : { "name": "" }
    }

    const end = <>
        {!localStorage.getItem('user') && (
            /*<button onClick={() => login()}>Sign in with Google 🚀 </button>*/
            <Button rounded className="mr-2">
                <GoogleLogin size='small' width='20' type='icon' shape='circle' theme='filled_blue' onSuccess={responseMessage} onError={errorMessage} />
            </Button>
        )}
        {localStorage.getItem('user') && (
            <Button
                rounded
                tooltip={getCurrentUser()["name"] + "\n User Profile "}
                tooltipOptions={{ position: 'top' }}
                className="mr-2"
                style={{ padding: 0, borderRadius: "50%" }}>
                <img
                    rounded
                    className='custom-target-icon'
                    size='small'
                    alt={localStorage.getItem('user').picture}
                    style={{ height: 37, borderRadius: "50%" }}
                    src={JSON.parse(localStorage.getItem('user')).picture}
                    onClick={() => { window.location.href = '/userprofile' }}
                />
            </Button>
        )}
        <Button
            rounded
            tooltip="Notifications"
            tooltipOptions={{ position: 'top' }}
            icon="pi pi-bell"
            className="mr-2"
            style={{ height: 39 }}>
            <Badge
                value="2"
                severity="info"></Badge>
        </Button>
        <Button
            rounded
            tooltip="Log out"
            tooltipOptions={{ position: 'top' }}
            icon="pi pi-fw pi-power-off"
            className="mr-2"
            onClick={logOut}></Button>
    </>

    return (
        <div>
            <Menubar
                model={navlist}
                end={end}
            />
            <Sidebar visible={sidebarVisible} onHide={() => setSidebarVisible(false)}></Sidebar>
        </div>
    )
}
export default Navigation;