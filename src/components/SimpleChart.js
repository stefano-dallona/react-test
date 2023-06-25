import { useState, useCallback, useEffect } from "react"
import * as d3 from 'd3-v6'
import * as fc from 'd3fc'

import '../css/d3fc.scss'

export const SimpleChart = ({ chartId, data, width, height }) => {
    const id = chartId === undefined ? "chart" : chartId;
    const yExtent = fc.extentLinear().accessors([(d) => d.high, (d) => d.low]);
    const xExtent = fc.extentDate().accessors([(d) => d.date]);
  
    const gridlines = fc.annotationSvgGridline();
    const candlestick = fc.seriesSvgCandlestick();
    const multi = fc.seriesSvgMulti().series([gridlines, candlestick]);
  
    const chart = fc
      .chartCartesian(d3.scaleTime(), d3.scaleLinear())
      .svgPlotArea(multi);
  
    chart.xDomain(xExtent(data));
    chart.yDomain(yExtent(data));
  
    const render = () => {
      d3.select(`#${id}`).datum(data).call(chart);
    };
  
    useEffect(() => {
      render();
    }, [data]);
  
    return (
      <div
        id={id}
        style={{
          width: width != undefined ? width : "100%",
          height: height != undefined ? height : "95vh"
        }}
      ></div>
    );
  };
  
export const StreamingChart = ({ initialData, next }) => {
    const stream = fc.randomFinancial().stream();
    const [data, setData] = useState(initialData || stream.take(100));
    const getNext = useCallback(() => next ? next() : [], stream.next());
  
    useEffect(() => {
    /**/
      const timer = setTimeout(() => {
        setData((prevData) => {
          const data = prevData.slice(1);
          const nextPoint = getNext();
          //console.log(nextPoint);
          data.push(nextPoint);
          return data;
        });
      }, 200);
      return () => clearTimeout(timer);
    
    }, [data]);
  
    return <SimpleChart data={data} chartId="streaming-chart" />;
  };