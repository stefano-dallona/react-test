import { useEffect } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { DataView } from 'primereact/dataview';
import { Panel } from 'primereact/panel';
import { Button } from 'primereact/button';
import { Splitter, SplitterPanel } from 'primereact/splitter';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Divider } from 'primereact/divider';
import { useContainer } from '../components/ServicesContextProvider';


import Markdown from 'react-markdown';

import settings_icon from '../assets/icons/settings.svg'
import reports_icon from '../assets/icons/reports.svg'
import edit_icon from '../assets/icons/pencil.svg'
import search_icon from '../assets/icons/search.svg'

import '../css/home.css'

//var parse = require('html-react-parser');

export const Home = (props) => {
    const [tasks, setTasks] = useState([]);
    const [help, setHelp] = useState("");
    const servicesContainer = useContainer();
    const navigate = useNavigate()
    const markdownUrl = '/help/README.md'

    useEffect(() => {
        setTasks([
            { id: "1", name: "Configure new Run", img: settings_icon, description: "Configure a new elaboration, choosing input files, setting algorithms and parameters", command: () => { navigate("/run/configuration") } },
            { id: "2", name: "Analyze existing Run", img: reports_icon, description: "Analyze an existing elaboration, navigate waveforms, play files, compare metrics and spectrograms", command: () => { navigate("/run/analysis") } },
            { id: "3", name: "Edit Run", img: edit_icon, description: "Modify an existing elaboration by changing worker settings or input files", command: () => { navigate("/run/execution") } },
            { id: "4", name: "Find Run", img: search_icon, description: "Search an existing new elaboration composing your own queries", command: () => { navigate("/run/history") } },
        ])
    }, []);

    useEffect(() => {
        loadHelpPage(markdownUrl)
    }, []);

    const loadHelpPage = async (url) => {
        let helpPage = await servicesContainer.notificationService.loadHelpPage(url, true, false)
        setHelp(helpPage)
    }

    const taskTemplate = (task) => {
        if (!task) {
            return;
        }

        return (
            <div className="col-12 sm:col-6 lg:col-12 xl:col-4 p-2">
                <div className="p-4 border-1 surface-border surface-card border-round">
                    <img className="w-9 sm:w-16rem xl:w-10rem shadow-2 block xl:block mx-auto border-round"
                        src={`${task.img}`}
                        alt={task.name}
                        width={'100%'}
                        height={'auto'}
                        style={{ backgroundColor: 'grey' }} />
                    <div className="flex flex-wrap align-items-center justify-content-between gap-2">
                        <div className="flex align-items-center gap-2">
                            <span className="mt-8 font-bold">{task.name}</span>
                        </div>
                        <Divider />
                        <div className="flex align-items-center gap-2">
                            <span className="font-italic">{task.description}</span>
                        </div>
                    </div>
                    <div className="flex align-items-center justify-content-between">
                        <Button
                            icon="pi pi-arrow-right"
                            className="mt-8 p-button-rounded"
                            tooltip='Proceed'
                            onClick={task.command}></Button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="card">
            <Panel className="flex">
                <Splitter style={{ height: '100%' }}>
                    <SplitterPanel size={30} className="flex align-items-center justify-content-center">
                        <Panel header={'PLC Testbench is ...'} style={{ position: "relative", width: "100%", height: '100%', border: 'none' }}>
                            <ScrollPanel style={{ position: "relative", width: '30rem', height: '69vh', textAlign: 'justify', padding: '20px' }} className="custombar1">
                                <Markdown>{help}</Markdown>
                            </ScrollPanel>
                        </Panel>
                    </SplitterPanel>
                    <SplitterPanel size={70} className="flex align-items-center justify-content-center">
                        <Panel header={'What would you like to do ?'} style={{ position: "relative", width: "100%", height: '100%', border: 'none' }}>
                            <DataView value={tasks} itemTemplate={taskTemplate} layout={'grid'} />
                        </Panel>
                    </SplitterPanel>
                </Splitter>
            </Panel>
        </div>
    )
}