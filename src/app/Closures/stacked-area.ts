import { IScore } from '../Model/score';
import * as d3 from 'd3';
export interface IMargin {
  top: number;
  bottom: number;
  left: number;
  right: number;
}
export interface IDimension {
  height: number;
  width: number;
}
export interface IChart {
  draw: (data: IScore[]) => void;
}

export interface IDate {
    index: number;
    date: Date;
}

export interface IStackedData {
    examDate: Date;
    values: [number, number];
}

export function stackedAreaChart(chartId: string, dims: IDimension): IChart {
  const margin: IMargin = {
    bottom: 50,
    left: 100,
    right: 30,
    top: 30,
  };
  const height = dims.height - margin.top - margin.bottom;
  const width = dims.width - margin.right - margin.left;
  dims = { height, width };
  let svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, any>;
  let chartData: IScore[] = [];
  let stackedData: any[] = [];
  let yScale: d3.ScaleLinear<number, number, never>;
  let xScale: d3.ScaleTime<number, number, never>;
  const colors = ['green', 'yellow', 'orange'];
  let group: d3.Selection<SVGGElement, unknown, HTMLElement, any>;
  let toolTip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
  let parentElement: d3.Selection<d3.BaseType, unknown, HTMLElement, any>;
  const format = (d: Date) =>
    `${d3.timeFormat('%b')(d)} ${d3.timeFormat('%e')(d)}`;
  const fillColor = '#D6C5C4';

  const drawArea = () => {
    const area = d3.area<any>()
    .x((d) => xScale(d.examDate))
    .y0((d) => yScale(d.values[0]))
    .y1((d) => yScale(d.values[1]))
    const areaGroup = group.append('g').attr('class', 'area-group');
    const allArea = areaGroup.selectAll('.stacked-area')
    .append('g')
    .attr('class', 'stacked-area')
    .data(stackedData)
    .enter();

    allArea
      .append('path')
      .attr('fill', (_, i) => colors[i])
      .attr('stroke', fillColor)
      .attr('stroke-width', 2)
      .attr('d', (d) => area(d));
  } 

  const addLabels = () => {
    group.append('text')
    .text('SNAPSHOT DATE')
    .attr('x', width / 2)
    .attr('y', yScale(-25))
    .attr('class', 'label');

    group
      .append('text')
      .text('AVG SCORE')
      .attr('class', 'label')
      .style('text-anchor', 'end')
      .attr('x', -(height / 2))
      .attr('y', -50)
      .attr('transform', 'rotate(-90)');
  }

  const moveTooltip = () => toolTip.style('opacity', 1);
  const hideTooltip = () => toolTip.transition().style('opacity', 0);

  const drawCircles = () => {
    const indicatorData: IStackedData[] = [];
    stackedData.forEach(s => {
        s.forEach((v: IStackedData) => indicatorData.push(v));
    })
    group
    .selectAll('circle')
    .data(indicatorData)
    .enter()
    .append('circle')
    .attr('cx', (d) => xScale(d.examDate))
    .attr('cy', (d) => yScale(d.values[1]))
    .attr('r', 6)
    .attr('fill', fillColor)
    .attr('stroke', '#873F49')
    .attr('stroke-width', 2)
    .on('mouseover', (event: MouseEvent, d: IStackedData) => {
      const toolTipData = chartData.find((c) => c.examDate.getTime() === d.examDate.getTime()) ?? null;
      showToolTip(toolTipData, event);
    })
    .on('mousemove', moveTooltip)
    .on('mouseleave', hideTooltip)
  }

  const showToolTip = (toolTipData: IScore | null, event: MouseEvent) => {
    if (!toolTipData) return;
    if (!toolTip) {
      toolTip = parentElement
        .append('div')
        .attr('class', 'toolTip')
        .style('opacity', 0)
        .style('font-size', '12px')
        .style('background-color', 'black')
        .style('color', 'white')
        .style('display', 'flex')
        .style('flex-flow', 'column')
        .style('border-radius', '5px')
        .style('padding', '3px')
        .style('user-select', 'none')
        .style('pointer-events', 'none')
        .style('position', 'absolute');
    }
    toolTip
      .style('opacity', 1)
      .style('left', `${event.x + 10}px`)
      .style('top', `${event.y + 10}px`).html(`
     <span>${format(toolTipData?.examDate)}</span>
     <span>Avg Score for 2023 is (${toolTipData[2023]}%)</span>
     <span>Avg Score for 2022 is (${toolTipData[2022]}%)</span>
     <span>Avg Score for 2021 is (${toolTipData[2021]}%)</span>
    `);
  };

  const addAxises = () => {
   //X Axis added 
    svg
      .append('g')
      .attr('transform', `translate(80, ${dims.height + 20})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(6)
          .tickFormat((d) => format(<Date>d))
      );
    //Y Axis added  
    svg
      .append('g')
      .attr('transform', `translate(70, 10)`)
      .call(d3.axisLeft(yScale));
  };

  const chart = {
    draw(data: IScore[]) {
      chartData = data;
      parentElement = d3.select(`#${chartId}`);
      svg = parentElement
        .append('svg')
        .attr('width', dims.width + margin.left + margin.right)
        .attr('height', dims.height + margin.top + margin.bottom);

      group = svg.append('g')
      .attr('transform', 'translate(80,10)');

      const stackKeys = d3.stack().keys(['2021', '2022', '2023']);
      const stackValues = stackKeys(data as any);
      stackValues.forEach((s) => {
        const currStack: IStackedData[] = [];
        s.forEach((d, i) => {
          currStack.push({
            values: d as [number, number],
            examDate: data[i].examDate,
          });
        });
        stackedData.push(currStack);
      });
      const [lastStack] = stackValues.slice(-1);
      yScale = d3.scaleLinear()
        .range([dims.height, 0])
        .domain([0, d3.max(lastStack , (d) => d[1]) ?? 0]);
      xScale = d3.scaleTime()
        .range([0, dims.width])
        .domain([chartData[0].examDate, chartData.slice(-1)[0]?.examDate]);

      drawArea();
      drawCircles();
      addAxises();
      addLabels();
      return chart;
    },
  };
  return chart;
}
