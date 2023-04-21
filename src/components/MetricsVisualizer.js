import React, { useEffect, useState } from "react";
import { trackPromise } from 'react-promise-tracker';

import { Chart } from 'primereact/chart'
import { Panel } from 'primereact/panel'

import { ConfigurationService } from '../services/testbench-configuration-service';
import { AnalysisService } from '../services/testbench-analysis-service';

var d3 = require('d3v3');

//https://d3-graph-gallery.com/graph/barplot_grouped_basicWide.html

export const MetricsVisualizer = React.forwardRef((props, ref) => {
    let [runId, setRunId] = useState([])
    let [metrics, setMetrics] = useState([])
    let [chartOptions, setChartOptions] = useState({})
    let [colorsMap, setColorsMap] = useState(new Map())

    useEffect(() => {
        let baseUrl = "http://localhost:5000"
        /*
        new AnalysisService(baseUrl).fetchMetricsFromFile().then((metrics) => {
            setMetrics(metrics)
        })
        */
        const metrics = {
            "linear": {
                labels: ['1000000', '1500000', '2000000', '2500000', '3000000', '3500000', '4000000'],
                datasets: [
                    {
                        label: 'Blues_Bass.wav',
                        data: [65, 59, 80, 81, 56, 55, 40],
                        fill: false,
                        tension: 0.0,
                        borderColor: "yellow"
                    },
                    {
                        label: 'ZeroECC',
                        data: [28, 48, 40, 19, 86, 27, 90],
                        fill: false,
                        borderDash: [5, 5],
                        tension: 0.0,
                        borderColor: "red"
                    },
                    {
                        label: 'LastPacketECC',
                        data: [12, 51, 62, 33, 21, 62, 45],
                        borderColor: "orange",
                        tension: 0.0,
                        backgroundColor: 'rgba(255,167,38,0.2)'
                    }
                ]
            },
            "scalar": {
                labels: ['Blues_Bass.wav', 'Blues_Guitar.wav', 'Song-4.wav', 'Song-5.wav', 'Song-6.wav', 'Song-7.wav', 'Song-8.wav'],
                datasets: [
                    {
                        label: 'PEAQ',
                        backgroundColor: "red",
                        borderColor: "blue",
                        data: [65, 59, 80, 81, 56, 55, 40]
                    },
                    {
                        label: 'SM-2',
                        backgroundColor: "green",
                        borderColor: "blue",
                        data: [28, 48, 40, 19, 86, 27, 90]
                    },
                    {
                        label: 'SM-3',
                        backgroundColor: "blue",
                        borderColor: "blue",
                        data: [67, 26, 54, 33, 46, 49, 77]
                    },
                    {
                        label: 'SM-4',
                        backgroundColor: "yellow",
                        borderColor: "blue",
                        data: [47, 36, 24, 73, 86, 29, 67]
                    }
                ]
            }
        }
        setMetrics(metrics)

        const options = {
            "linear": {
                maintainAspectRatio: false,
                aspectRatio: 0.5,
            },
            "scalar": {
                maintainAspectRatio: false,
                aspectRatio: 0.5,
            }
        }
        setChartOptions(options)
    }, [runId])

    const renderLinearMetrics = () => {
        return (
            <Panel header="Linear" toggleable>
                <Chart type="line" data={metrics["linear"]} options={chartOptions["linear"]} />
            </Panel>
        )
    }

    const renderScalarMetrics = () => {
        return (
            <Panel header="Scalar" toggleable>
                <Chart type="bar" data={metrics["scalar"]} options={chartOptions["scalar"]} />
            </Panel>
        )
    }

    return (
        <div id="MetricsVisualizer">
            {renderLinearMetrics()}
            {renderScalarMetrics()}
        </div>
    )
})