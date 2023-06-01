import React, { useEffect, useState, useRef } from "react";
import { trackPromise } from 'react-promise-tracker';

import { Chart } from 'primereact/chart'
import { Panel } from 'primereact/panel'
import { Dropdown } from 'primereact/dropdown'

import { useContainer } from "../components/ServicesContextProvider"

var d3 = require('d3v3');
const _ = require('lodash');

//https://d3-graph-gallery.com/graph/barplot_grouped_basicWide.html

export const MetricsVisualizer = React.forwardRef((props, ref) => {
    let [runId, setRunId] = useState(props.runId || [])
    let [metricsMetadata, setMetricsMetadata] = useState([])
    let [metricsData, setMetricsData] = useState([])
    let [selectedLinearMetric, setSelectedLinearMetric] = useState(null)
    let [selectedScalarMetric, setSelectedScalarMetric] = useState(null)
    let [chartOptions, setChartOptions] = useState({})
    let [colorsMap, setColorsMap] = useState(new Map())
    let servicesContainer = useContainer()
    let metricsHandler = useRef(props.metricsHandler || (() => { return [] }))
    let colors = props.colors

    useEffect(() => {
        const fetchMetricsMetadata = async () => {
            let metricsMetadata = await retrieveMetricsMetadata()
            //setSelectedLinearMetric(metricsMetadata["linear"][0] ? metricsMetadata["linear"][0] : null)
            //setSelectedScalarMetric(metricsMetadata["scalar"][0] ? metricsMetadata["scalar"][0] : null)
            setMetricsMetadata(metricsMetadata)
        }
        fetchMetricsMetadata()

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

    useEffect(() => {
        const fetchMetrics = async (category, metricType) => {
            let newMetricsData = await retrieveMetricsData(metricsHandler.current(), category, metricType)
            let clonedMetricsData = _.cloneDeep(metricsData)
            setMetricsData({ ...clonedMetricsData, [category] : newMetricsData[category] })
        }

        if (selectedLinearMetric) {
            fetchMetrics("linear", selectedLinearMetric.code)
        }
    }, [selectedLinearMetric])

    useEffect(() => {
        const fetchMetrics = async (category, metricType) => {
            let newMetricsData = await retrieveMetricsData(metricsHandler.current(), category, metricType)
            let clonedMetricsData = _.cloneDeep(metricsData)
            setMetricsData({ ...clonedMetricsData, [category] : newMetricsData[category] })
        }
        if (selectedScalarMetric) {
            fetchMetrics("scalar", selectedScalarMetric.code)
        }
    }, [selectedScalarMetric])

    const retrieveMetricsMetadata = async () => {
        let categories = ["linear", "scalar"]
        let metricsMetadata = await trackPromise(Promise.all(categories.map(async (category, index) => {
            return { "category": category, "metrics": await servicesContainer.configurationService.getOutputAnalysers(category) }
        })))
        return {
            linear: metricsMetadata.filter((x) => x.category == "linear").flatMap((x) => x.metrics.map((x) => { return { "name": x, "code": x } })),
            scalar: metricsMetadata.filter((x) => x.category == "scalar").flatMap((x) => x.metrics.map((x) => { return { "name": x, "code": x } }))
        }
    }

    const retrieveMetricsData = async (metrics, category, metricType) => {
        let channel = 0
        let metricCategory = category
        let metricsToLoad = metrics.filter((metric) => {
            return metric.category == category && metric.name == metricType
        })
        if (metricsToLoad.length == 0) {
            return {
                [category]: {
                    labels: [],
                    datasets: []
                }
            }
        }
        let metricsData = await trackPromise(Promise.all(metricsToLoad.map(async (metric, index) => {
            return servicesContainer.analysisService.fetchMetricsFromFile(runId, metric.parent_id, metric.parent_id, metric.uuid, metricCategory)
        })))
        let samplesNumber = metricsData.map(metric => metric.length)
        let labels = category == "scalar"
            ? metricsToLoad.map((metric) => metric.path.slice(1).map((e) => e.name).join("-"))
            : [...Array(Math.max(...samplesNumber))].map((_, i) => i + 1)
        return {
            [category]: {
                labels: labels,
                datasets: (category == "scalar")
                    ? Object.entries(metricsData[0]).map(([k, v], index) => {
                        return {
                            label: k,
                            backgroundColor: colors[index],
                            borderColor: colors[index],
                            data: metricsData.map((metric, index) => metric[k])
                        }
                    }) : metricsData.flatMap((metric, index) => {
                        return {
                            label: metrics[index].path.slice(1).map((e) => e.name).join("-"),
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
                        optionLabel="name"
                        placeholder="Select metric"
                        className="w-full md:w-20rem" />
                </div>
                <Chart type="line" data={metricsData["linear"]} options={chartOptions["linear"]} />
            </Panel>
        )
    }

    const renderScalarMetrics = () => {
        return (
            <Panel header="Scalar" toggleable>
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
                        optionLabel="name"
                        placeholder="Select metric"
                        className="w-full md:w-20rem" />
                </div>
                <Chart type="bar" data={metricsData["scalar"]} options={chartOptions["scalar"]} />
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