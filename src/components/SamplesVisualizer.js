import React, { Component } from 'react';
import { trackPromise } from 'react-promise-tracker';

import { ConfigurationService } from '../services/testbench-configuration-service';
import { AnalysisService } from '../services/testbench-analysis-service';

var d3 = require('d3v3');

class SamplesVisualizer extends Component {

    constructor(props) {
        super(props);

        this.runId = props.runId || ""

        this.servicesContainer = props.servicesContainer

        this.state = {
            isReady: false
        };
    }

    componentDidMount() {

    }

    async fetchSamples(audioFiles, colors, offset, numsamples, channel = 0) {
        let unitOfMeas = "samples"
        const startat = offset - numsamples
        const nsamples = 3 * numsamples
        let samples = await trackPromise(Promise.all(audioFiles.map(async (file) => {
            return await this.servicesContainer.analysisService.fetchSamplesFromFile(this.runId, audioFiles.uuid, file.uuid, channel, startat, nsamples, unitOfMeas)
        })));
        this.audioFiles = audioFiles;
        this.samples = samples;
        this.colors = colors;
        this.setState({
            isReady: true
        });
    }

    renderSamplesChart(data, colors, containerSelector) {
        function extractChannelData(data, channel) {
            return data.map((it) => {
                var point = { "sample": it["sample"], "value": it["values"][channel - 1] }
                return point
            })
        }

        function extractSampleData(data) {
            return data.map((it) => {
                var point = { "sample": it["cx"], "value": it["cy"] }
                return point
            })
        }

        function display() {
            var viewportExtent = navViewport.empty() ? navXScale.domain() : navViewport.extent();
            console.log("viewportExtent: (" + viewportExtent[0] + "," + viewportExtent[1] + ")")
            zoomToPeriod(viewportExtent[0], viewportExtent[1]);
        }

        function drawLine(lineData, lineColor, lineLabel, lineId) {
            // append line to svg
            var group = chartsContainer.append("g")
                .attr('class', lineId);

            var l = group.append("svg:path")
                .attr('id', lineId)
                .attr('d', line(lineData))
                .attr('stroke', lineColor)
                .attr('stroke-width', 2)
                .attr('fill', 'none');

            return group;
        }

        function drawPoints(pointData, pointColor, onLine) {
            // create points for line
            var points = onLine.selectAll(".points")
                .data(pointData)
                .enter().append("svg:circle")
                .style("cursor", "pointer")
                .attr("stroke", pointColor)
                .attr("fill", function (d, i) { return pointColor })
                .attr("cx", function (d, i) { return xScale(d.sample) })
                .attr("cy", function (d, i) { return yScale(d.value) })
                .attr("r", function (d, i) { return 3 })
                .on("mouseover", function (d) {

                    // animate point useful when we have points ploted close to each other.
                    d3.select(this)
                        .transition()
                        .duration(300)
                        .attr("r", 6);

                    // code block for tooltip
                    tooltipDiv.transition()
                        .duration(200)
                        .style("opacity", .9);
                    tooltipDiv.html(d.sample + ' : ' + d.value)
                        .style("background", pointColor)
                        .style("position", "absolute")
                        .style("left", (d3.event.pageX) - 30 + "px")
                        .style("top", (d3.event.pageY - 40) + "px");
                })
                .on("mouseout", function (d) {

                    // animate point back to origional style
                    d3.select(this)
                        .transition()
                        .duration(300)
                        .attr("r", 3);

                    tooltipDiv.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
            return points;
        }

        function getLabelPositions(legendItems, rectWidth, rectHeight,
            legendLeft, legendTop, legendWidth, verticalSpacing, horizontalSpacing,
            condensedLayout = true) {
            let canvas = document.createElement('canvas'),
                context = canvas.getContext('2d');

            function getSize(text, fontSize, fontFace) {
                context.font = fontSize + ' ' + fontFace;
                let measure = context.measureText(text)
                return {
                    width: rectWidth + horizontalSpacing + measure.width + horizontalSpacing,
                    height: measure.fontBoundingBoxAscent + measure.fontBoundingBoxDescent + verticalSpacing
                }
            }

            let legendItemsSizes = legendItems.map((legendItem, index) => {
                return getSize(legendItem.text,
                    legendItem.fontSize,
                    legendItem.fontFamily)
            })
            let maxWidth = Math.max(...legendItemsSizes.map((legentItemsSize) => {
                return legentItemsSize.width
            }))
            let maxHeight = Math.max(...[rectHeight, ...legendItemsSizes.map((legentItemsSize) => {
                return legentItemsSize.height
            })])

            let maxHorizontalItems = Math.floor((legendWidth - 2.0 * legendLeft) / maxWidth)
            let spaceBetweenItems = maxHorizontalItems <= legendItems.length ? maxWidth : legendWidth * 1.0 / legendItems.length
            let condensedLayoutLeft = Math.max((legendWidth - Math.min(maxHorizontalItems, legendItems.length) * maxWidth) / 2.0, 0)

            let widths = legendItemsSizes.map((legendItemsSize, index) => {
                let rowNumber = Math.floor(index / maxHorizontalItems)
                let colNumber = index % maxHorizontalItems
                return {
                    x: condensedLayout ? legendLeft + condensedLayoutLeft + colNumber * maxWidth : legendLeft + colNumber * spaceBetweenItems,
                    y: legendTop + rowNumber * maxHeight,
                    width: condensedLayout ? maxWidth : spaceBetweenItems,
                    height: maxHeight,
                    rectWidth: rectWidth,
                    rectHeight: rectHeight
                }
            })

            return widths
        }

        function createLegend(legendColor, lineId, legendText, position) {
            var legendGroup = svg.append("g")
                .style('cursor', 'pointer')
                .on("click", function () {
                    var display = (d3.select("." + lineId).style("display") !== "none") ? 'none' : '';
                    d3.select("#legend-" + lineId).style("text-decoration", (display === 'none') ? "line-through" : '');
                    d3.select("." + lineId)
                        .transition()
                        .duration(500)
                        .style("display", display)
                });

            let rect = legendGroup.append("rect")
                .attr("width", position.rectWidth)
                .attr("height", position.rectHeight)
                .attr("x", position.x)
                .attr("y", position.y)
                .attr("stroke", legendColor)
                .attr("fill", legendColor)
                .attr("stroke-width", 1)
                .style("opacity", 0)
                .transition()
                .duration(600)
                .style("opacity", 1)

            let textElement = legendGroup.append('text')
                .attr('id', 'legend-' + lineId)
                .attr('text-anchor', 'left')
                .attr('font-family', 'sans-serif')
                .attr('font-size', '12px')
                .attr('stroke', 'white')
                .attr("stroke-width", 0.1)
                .attr('fill', 'white')
                .attr("transform", `translate(${position.x + 1.1 * position.rectWidth},${position.y + 0.8 * position.rectHeight})`)
                .text(legendText)
            /*
            rect[0][0].setAttribute("width", position.rectWidth)
            legendGroup[0][0].setAttribute("x", position.x)
            legendGroup[0][0].setAttribute("y", position.y)
            */
            marginLegend += 100;
        }

        function zoomToPeriod(from, to) {
            chartsContainer.call(zoom.x(xScale.domain([from, to])));
            updateAxis();
            updateCharts();
        }

        function updateCharts() {
            chartConfig.data.forEach(function (v, i) {
                const lineId = 'line-' + i
                updateLine(lineId, v)
                updatePoints(lineId, v);
            })
        }

        function updateAxis() {
            mainGroup.select(".x.axis").call(xAxis);
            mainGroup.select(".y.axis").call(yAxis);

            navViewport.extent(xScale.domain());
            navigatorGroup.select('.nav-viewport').call(navViewport);
        }

        function updateLine(lineId, lineData) {
            d3.select("#" + lineId)
                .data([lineData])
                .attr("d", line(lineData));
        }

        function updatePoints(lineId, pointData) {
            const points = d3.select("." + lineId).selectAll("circle");
            points.data(pointData)
                .attr("cx", function (d, i) {
                    return xScale(d.sample)
                })
                .attr("cy", function (d, i) {
                    return yScale(d.value)
                })
        }

        // chart data
        var chartConfig = {
            lineConnectorLength: 40,
            axisLabel: {
                xAxis: 'Sample',
                yAxis: 'Value'
            },
            lineLabel: {
                height: 20,
                width: 60,
            },

            data: data.map((series) => extractSampleData(series))
        };

        var minSample = d3.min(chartConfig.data.flat(), function (d) { return d.sample; })
        var maxSample = d3.max(chartConfig.data.flat(), function (d) { return d.sample; })

        var minValue = d3.min(chartConfig.data.flat(), function (d) { return d.value; })
        var maxValue = d3.max(chartConfig.data.flat(), function (d) { return d.value; })

        var margin = { top: 20, right: 50, bottom: 30, left: 0 },
            navigatorMarginTop = 30,
            navigatorHeight = 60,
            width = window.innerWidth - margin.left - margin.right,
            height = Math.max(window.innerHeight / 3 - margin.top - margin.bottom - navigatorHeight - navigatorMarginTop, 200);
        var marginLegend = 0;

        var tickHeight = height, tickWidth = width
        var tickHeight = 0, tickWidth = 0

        var xScale = d3.scale.linear()
            .domain([minSample, maxSample])
            .range([0, width]);

        var yScale = d3.scale.linear()
            .domain([minValue, maxValue])
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(xScale)
            .orient("bottom")
            .tickSize(-tickHeight)

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .orient("left")
            .ticks(6)
            .tickSize(-tickWidth);

        var zoom = d3.behavior.zoom()
            .x(xScale);


        d3.select("body").select(".tooltip").html(null)
        d3.select(containerSelector).html(null)

        // Define the div for the tooltip
        var tooltipDiv = d3.select("body").append("div")
            .attr("class", "tooltip");

        var svg = d3.select(containerSelector).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom + navigatorHeight + navigatorMarginTop);

        var mainGroup = svg.append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // Clip-path
        var chartsContainer = mainGroup.append('g')
            .attr('clip-path', 'url(#plotAreaClip)')
            .call(zoom);

        chartsContainer.append('clipPath')
            .attr('id', 'plotAreaClip')
            .append('rect')
            .attr({ width: width, height: height });

        // Line chart
        var line = d3.svg.line()
            .x(function (d) {
                return xScale(d.sample);
            })
            .y(function (d) {
                return yScale(d.value);
            });

        let _this = this
        //const colorsMap = ["#00b7d4", "#f57738", "#f50038", "#f57738", "#f50038"]
        const colorsMap = _this.colors

        let legendItems = chartConfig.data.map((item, index) => {
            return {
                "text": _this.audioFiles[index].label,
                "fontSize": "12px",
                "fontFamily": "sans-serif"
            }
        })
        let rectWidth = 42, rectHeight = 14, legendLeft = 0,
            legendTop = 10, legendWidth = window.innerWidth,
            verticalSpacing = 10, horizontalSpacing = 10,
            condensedLayout = true

        let legendLabelPositions = getLabelPositions(legendItems, rectWidth, rectHeight,
            legendLeft, legendTop, legendWidth, verticalSpacing, horizontalSpacing,
            condensedLayout)
        console.log(`legendLabelPositions:${JSON.stringify(legendLabelPositions)}`)

        chartConfig.data.forEach(function (v, i) {
            const lineId = "line-" + i
            const fileName = _this.audioFiles[i].label
            const line = drawLine(v, colorsMap[i], fileName, lineId);
            const points = drawPoints(v, colorsMap[i], line);
            createLegend(colorsMap[i], lineId, fileName, legendLabelPositions[i]);
        })

        // Axis
        mainGroup.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        mainGroup.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        // Navigator
        var navXScale = d3.scale.linear()
            .domain([minSample, maxSample])
            .range([0, width]);

        var navYScale = d3.scale.linear()
            .domain([minValue || 0, maxValue || 1])
            .range([navigatorHeight, 0]);

        var navXAxis = d3.svg.axis()
            .scale(navXScale)
            .orient("bottom");

        var navData = d3.svg.area()
            .interpolate("basis")
            .x(function (d) {
                return navXScale(d.sample);
            })
            .y0(navigatorHeight)
            .y1(function (d) {
                return navYScale(d.value);
            });

        var navigatorGroup = svg.append("g")
            .attr("class", "navigator")
            .attr("width", width + margin.left + margin.right)
            .attr("height", navigatorHeight + margin.top + margin.bottom)
            .attr("transform", "translate(" + margin.left + "," + (margin.top + height + navigatorMarginTop) + ")");

        navigatorGroup.append("path")
            .attr("class", "data")
            .attr("d", navData(chartConfig.data[0]));

        svg.append("g")
            .attr("class", "x nav-axis")
            .attr("transform", "translate(" + margin.left + "," + (margin.top + height + navigatorHeight + navigatorMarginTop) + ")")
            .call(navXAxis);

        // Navigator viewport
        var navViewport = d3.svg.brush()
            .x(navXScale)
            .extent(xScale.domain())
            .on("brush", display);

        navigatorGroup.append("g")
            .attr("class", "nav-viewport")
            .call(navViewport)
            .selectAll("rect")
            .attr("height", navigatorHeight);
    }

    render() {
        return (
            <div id="audioFileSamples" >
                {this.state.isReady && this.renderSamplesChart(this.samples, this.colors, "#audioFileSamples")}
            </div>
        )
    }
}

export default SamplesVisualizer;