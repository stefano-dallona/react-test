import { React, useState } from 'react';

import { Menubar } from 'primereact/menubar';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';


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
        <Button icon="pi pi-sign-out"></Button>
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