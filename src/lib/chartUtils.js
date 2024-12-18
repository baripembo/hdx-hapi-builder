import * as d3 from 'd3';

function draw_sparklines(commodity, containerSelector) {
  const container = d3.select(containerSelector);

  const prices = commodity.prices.map(p => p.price);
  const times = commodity.prices.map(p => new Date(p.reference_period_start));

  const margin = { top: 10, right: 10, bottom: 10, left: 10 };
  const width = 100 - margin.left - margin.right;
  const height = 40 - margin.top - margin.bottom;

  const x = d3.scaleTime()
    .domain(d3.extent(times))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([d3.min(prices), d3.max(prices)])
    .range([height, 0]);

  const line = d3.line()
    .x((d, i) => x(times[i]))
    .y((d) => y(d));

  const svg = container.append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  svg.append("path")
    .datum(prices)
    .attr("fill", "none")
    .attr("stroke", "#007ce0")
    .attr("stroke-width", 1.5)
    .attr("d", line);
}

export { draw_sparklines }