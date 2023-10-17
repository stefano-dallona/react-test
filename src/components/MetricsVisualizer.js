import React, { useEffect, useState, useRef } from "react";
import { trackPromise } from 'react-promise-tracker';

import { Chart } from 'primereact/chart'
import { Panel } from 'primereact/panel'
import { Dropdown } from 'primereact/dropdown'

import { useContainer } from "../components/ServicesContextProvider"

import startCase from 'lodash/startCase';

var d3 = require('d3v3');
const _ = require('lodash');


//https://d3-graph-gallery.com/graph/barplot_grouped_basicWide.html

export const MetricsVisualizer = React.forwardRef((props, ref) => {
    let [runId, setRunId] = useState(props.runId || [])
    let [metricsMetadata, setMetricsMetadata] = useState([])
    let [metricsData, setMetricsData] = useState([])
    let [selectedLinearMetric, setSelectedLinearMetric] = useState(null)
    let [selectedScalarMetric, setSelectedScalarMetric] = useState(null)
    let [selectedChannel, setSelectedChannel] = useState(props.selectedChannel)
    let [selectedLossSimulation, setSelectedLossSimulation] = useState(props.selectedLossSimulation)
    let [chartOptions, setChartOptions] = useState({})
    let [colorsMap, setColorsMap] = useState(new Map())
    let servicesContainer = useContainer()
    let metricsHandler = useRef(props.metricsHandler || (() => { return [] }))
    let colors = props.colors
    let channels = props.channels || []
    let lossSimulations = props.lossSimulations || []
    let zoomedRegion = props.zoomedRegion || {
        offset: 0,
        numSamples: -1
    }
    let chart = useRef(null)

    useEffect(() => {
        const fetchMetricsMetadata = async () => {
            let metricsMetadata = await retrieveMetricsMetadata()
            //setSelectedLinearMetric(metricsMetadata["linear"][0] ? metricsMetadata["linear"][0] : null)
            //setSelectedScalarMetric(metricsMetadata["scalar"][0] ? metricsMetadata["scalar"][0] : null)
            setMetricsMetadata(metricsMetadata)
        }
        fetchMetricsMetadata()

        // REFERENCE: https://www.youtube.com/watch?v=yhQnEN_0slA
        if (chart.current) {
            chart.current.oncontextmenu = function (e) {
                e.preventDefault();
            };
            chart.current.getCanvas().oncontextmenu = function (e) {
                e.preventDefault();
            };
        }

        // REFERENCE: https://www.chartjs.org/docs/latest/configuration/legend.html
        const toggleLegendItem = (legendItem, legend, visible = null) => {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;

            if (visible == null) {
                if (ci.isDatasetVisible(index)) {
                    ci.hide(index);
                    legendItem.hidden = true;
                } else {
                    ci.show(index);
                    legendItem.hidden = false;
                }
                return
            }

            if (!visible) {
                ci.hide(index);
                legendItem.hidden = true;
            } else {
                ci.show(index);
                legendItem.hidden = false;
            }
        }

        const newLegendClickHandler = function (event, legendItem, legend) {
            console.log(`ChartJS: onClick: ${event.native.button}`)
            const index = legendItem.datasetIndex
            const ci = legend.chart
            const legendItemIsVisible = ci.isDatasetVisible(index)

            if (!event.native.altKey) {
                toggleLegendItem(legendItem, legend)
            } else {
                legend.legendItems.forEach((item) => {
                    toggleLegendItem(item, legend, (item.text === legendItem.text) ? !legendItemIsVisible : legendItemIsVisible)
                });
            }
        }
        const options = {
            "linear": {
                maintainAspectRatio: false,
                aspectRatio: 0.5,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        },
                        onClick: newLegendClickHandler
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'white'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'white'
                        }
                    }
                }
            },
            "scalar": {
                maintainAspectRatio: false,
                aspectRatio: 0.5,
                scales: {
                    x: {
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'white'
                        }
                    },
                    y: {
                        ticks: {
                            color: 'white'
                        },
                        grid: {
                            color: 'white'
                        }
                    }
                }
            }
        }
        setChartOptions(options)
    }, [runId])

    useEffect(() => {
        const fetchMetrics = async (category, metricType, channel, offset, numSamples, lossSimulation) => {
            let newMetricsData = await retrieveMetricsData(metricsHandler.current(selectedLossSimulation), category, metricType, channel, offset, numSamples, lossSimulation)
            let clonedMetricsData = _.cloneDeep(metricsData)
            setMetricsData({ ...clonedMetricsData, [category]: newMetricsData[category] })
        }

        if (selectedLinearMetric) {
            let channel = 0
            let offset = zoomedRegion.current ? zoomedRegion.current.offset : 0
            let numSamples = zoomedRegion.current ? zoomedRegion.current.numSamples : -1

            fetchMetrics("linear", selectedLinearMetric.code, channel, offset, numSamples, selectedLossSimulation)
        }
    }, [selectedLinearMetric, selectedLossSimulation])

    useEffect(() => {
        const fetchMetrics = async (category, metricType) => {
            let newMetricsData = await retrieveMetricsData(metricsHandler.current(selectedLossSimulation), category, metricType)
            let clonedMetricsData = _.cloneDeep(metricsData)
            setMetricsData({ ...clonedMetricsData, [category]: newMetricsData[category] })
        }
        if (selectedScalarMetric) {
            let channel = 0
            let offset = zoomedRegion.current ? zoomedRegion.current.offset : 0
            let numSamples = zoomedRegion.current ? zoomedRegion.current.numSamples : -1

            fetchMetrics("scalar", selectedScalarMetric.code, channel, offset, numSamples, selectedLossSimulation)
        }
    }, [selectedScalarMetric, selectedLossSimulation])

    const retrieveMetricsMetadata = async () => {
        let usedMetrics = metricsHandler.current(selectedLossSimulation).map((metric) => metric.name)
        let categories = ["linear", "scalar"]
        let metricsMetadata = await trackPromise(Promise.all(categories.map(async (category, index) => {
            return { "category": category, "metrics": await servicesContainer.configurationService.getOutputAnalysers(category, runId) }
        })))
        return {
            linear: metricsMetadata.filter((x) => {
                return x.category === "linear"
            }).flatMap((x) => x.metrics.filter((metric) => {
                return usedMetrics.includes(metric)
            }).map((x) => {
                return { "name": x, "label": startCase(x), "code": x }
            })),
            scalar: metricsMetadata.filter((x) => {
                return x.category === "scalar"
            }).flatMap((x) => x.metrics.filter((metric) => {
                return usedMetrics.includes(metric)
            }).map((x) => {
                return { "name": x, "label": startCase(x), "code": x }
            }))
        }
    }

    const retrieveMetricsData = async (metrics, category, metricType,
        channel = 0, offset = 0, numSamples = -1, lossSimulation) => {
        let metricCategory = category
        let metricsToLoad = metrics.filter((metric, index) => {
            return metric.category === category && metric.name === metricType
            //&& index === 0
        })
        if (metricsToLoad.length === 0) {
            return {
                [category]: {
                    labels: [],
                    datasets: []
                }
            }
        }
        let metricsData = await trackPromise(Promise.all(metricsToLoad.map(async (metric, index) => {
            return servicesContainer.analysisService.fetchMetricsFromFile(runId, metric.parent_id, metric.parent_id,
                metric.uuid, metricCategory, channel, offset, numSamples, lossSimulation, "samples")
        })))
        let samplesNumber = metricsData.map(metric => metric.length)
        let labels = category === "scalar"
            ? metricsToLoad.map((metric) => metric.path.slice(1).map((e) => e.name).join("-"))
            : [...Array(Math.max(...samplesNumber))].map((_, i) => offset + i + 1)
        return {
            [category]: {
                labels: labels,
                datasets: (category === "scalar")
                    ? Object.entries(metricsData[0]).map(([k, v], index) => {
                        return {
                            label: k,
                            backgroundColor: colors[index],
                            borderColor: colors[index],
                            data: metricsData.map((metric, index) => metric[k])
                        }
                    }) : metricsData.flatMap((metric, index) => {
                        return {
                            label: metricsToLoad[index].path.slice(1).map((e) => e.name).join("-"),
                            backgroundColor: colors[index],
                            borderColor: colors[index],
                            fill: false,
                            tension: 0.0,
                            data: metric.map((sample) => { return sample.values[channel] })
                        }
                    })
            }
        }
    }

    const renderLinearMetrics = () => {
        return (
            <Panel header="Linear" toggleable>
                <div className="card flex flex-wrap gap-3 p-fluid mb-6" >
                    <div id="pnl-selectedLinearMetric" className="flex-auto">
                        <label htmlFor='selectedLinearMetric'
                            className="font-bold block ml-2 mb-2"
                            style={{ color: 'white' }}>Metric</label>
                        <Dropdown inputId='selectedLinearMetric'
                            id='selectedLinearMetric'
                            value={selectedLinearMetric}
                            onClick={(e) => { false && e.stopPropagation() }}
                            onChange={(e) => { setSelectedLinearMetric(e.value) }}
                            options={metricsMetadata["linear"]}
                            optionLabel="label"
                            placeholder="Select metric"
                            className="w-full md:w-20rem" />
                    </div>
                    <div id="pnl-selectedChannel" className="flex-auto">
                        <label htmlFor='selectedChannel' className="font-bold block ml-2 mb-2" style={{ color: 'white' }}>Channel</label>
                        <Dropdown inputId='selectedChannel'
                            id='selectedChannel'
                            value={selectedChannel}
                            onClick={(e) => { false && e.stopPropagation() }}
                            onChange={(e) => { setSelectedChannel(e.value) }}
                            options={channels}
                            disabled={false}
                            placeholder="Select channel"
                            className="w-full md:w-20rem" />
                    </div>
                    <div id="pnl-displayedLossSimulations" className="flex-auto">
                        <label htmlFor='displayedLossSimulations' className="font-bold block ml-2 mb-2" style={{ color: 'white' }}>Displayed loss simulations</label>
                        <Dropdown inputId='displayedLossSimulations'
                            id='displayedLossSimulations'
                            value={selectedLossSimulation}
                            onClick={(e) => { false && e.stopPropagation() }}
                            onChange={(e) => { setSelectedLossSimulation(e.value) }}
                            options={lossSimulations}
                            optionLabel="label"
                            optionValue='uuid'
                            display="chip"
                            disabled={false}
                            placeholder="Select loss simulations"
                            className="w-full md:w-20rem" />
                    </div>
                </div>
                <Chart type="line" data={metricsData["linear"]} options={chartOptions["linear"]} />
            </Panel>
        )
    }

    const renderScalarMetrics = () => {
        return (
            <Panel header="Scalar" toggleable>
                <div className="card flex flex-wrap gap-3 p-fluid mb-6" >
                    <div id="pnl-selectedScalarMetric" className="flex-auto">
                        <label htmlFor='selectedScalarMetric'
                            className="font-bold block ml-2 mb-2"
                            style={{ color: 'white' }}>Metric</label>
                        <Dropdown inputId='selectedScalarMetric'
                            id='selectedScalarMetric'
                            value={selectedScalarMetric}
                            onClick={(e) => { false && e.stopPropagation() }}
                            onChange={(e) => { setSelectedScalarMetric(e.value) }}
                            options={metricsMetadata["scalar"]}
                            optionLabel="label"
                            placeholder="Select metric"
                            className="w-full md:w-20rem" />
                    </div>
                    <div id="pnl-selectedChannel" className="flex-auto">
                        <label htmlFor='selectedChannel' className="font-bold block ml-2 mb-2" style={{ color: 'white' }}>Channel</label>
                        <Dropdown inputId='selectedChannel'
                            id='selectedChannel'
                            value={selectedChannel}
                            onClick={(e) => { false && e.stopPropagation() }}
                            onChange={(e) => { setSelectedChannel(e.value) }}
                            options={channels}
                            disabled={false}
                            placeholder="Select channel"
                            className="w-full md:w-20rem" />
                    </div>
                    <div id="pnl-displayedLossSimulations" className="flex-auto">
                        <label htmlFor='displayedLossSimulations' className="font-bold block ml-2 mb-2" style={{ color: 'white' }}>Displayed loss simulations</label>
                        <Dropdown inputId='displayedLossSimulations'
                            id='displayedLossSimulations'
                            value={selectedLossSimulation}
                            onClick={(e) => { false && e.stopPropagation() }}
                            onChange={(e) => { setSelectedLossSimulation(e.value) }}
                            options={lossSimulations}
                            optionLabel="label"
                            optionValue='uuid'
                            display="chip"
                            disabled={false}
                            placeholder="Select loss simulations"
                            className="w-full md:w-20rem" />
                    </div>
                </div>
                <Chart
                    type="bar"
                    ref={chart}
                    data={metricsData["scalar"]}
                    options={chartOptions["scalar"]} />
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