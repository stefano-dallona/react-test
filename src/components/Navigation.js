import { React, useState } from 'react';

import { Menubar } from 'primereact/menubar';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';


const Navigation = () => {
    const [sidebarVisible, setSidebarVisible] = useState(false);

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

    const end = <>
        <Button
            rounded
            tooltip="User Profile"
            tooltipOptions={{ position: 'top' }}
            icon="pi pi-user"
            className="mr-2"></Button>
        <Button
            rounded
            tooltip="Notifications"
            tooltipOptions={{ position: 'top' }}
            icon="pi pi-bell"
            className="mr-2"
            style={{height: 39}}>
            <Badge
                value="2"
                severity="info"></Badge>
        </Button>
        <Button
            rounded
            tooltip="Log out"
            tooltipOptions={{ position: 'top' }}
            icon="pi pi-fw pi-power-off"
            className="mr-2"></Button>
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