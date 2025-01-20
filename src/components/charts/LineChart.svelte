<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  export let data = [];

  let admin2Names = []; 
  let chartRef, minDate, maxDate;
  const formatTime = d3.utcFormat("%Y");
  const formatNum = d3.format(",");

  let selectedAdmin2 = admin2Names[0];

  // Extract unique admin2_name options
  $: admin2Names = Array.from(new Set(data.map(d => d.admin2_name))).sort();

  $: if (data.length > 0 && selectedAdmin2) {
    renderChart();
  }

  // Function to render the line chart
  const renderChart = () => {
    // Filter data for the selected admin2_name
    const filteredData = data
      .filter((d) => d.admin2_name === selectedAdmin2)
      .sort((a, b) => new Date(a.reference_period_start) - new Date(b.reference_period_start));

    // Get min and max dates for the selected data
    [minDate, maxDate] = d3.extent(filteredData, d => new Date(d.reference_period_start));

    // Clear chart
    d3.select(chartRef).selectAll('*').remove();

    if (filteredData.length === 0) return;

    // Group data by commodity_name and date
    const groupedData = d3.group(
      filteredData,
      d => d.commodity_code,
      d => d.reference_period_start
    );

    const aggregatedData = Array.from(groupedData, ([commodity_code, dateGroups]) => ({
      commodity_code,
      commodity_name: Array.from(dateGroups.values())[0][0].commodity_name, 
      unit: Array.from(dateGroups.values())[0][0].unit, 
      values: Array.from(dateGroups, ([date, entries]) => ({
        date: new Date(date),
        price: d3.mean(entries, d => +d.price) 
      }))
    }));

    // Set dimensions and margins for the chart
    const margin = { top: 20, right: 100, bottom: 30, left: 40 };
    const width = 900 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Append SVG element
    const svg = d3
      .select(chartRef)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain([minDate, maxDate])
      .range([0, width]);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(aggregatedData.flatMap(d => d.values), d => d.price)])
      .nice()
      .range([height, 0]);

    // Create color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(aggregatedData.map(d => d.commodity_code));

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale)
        .tickSize(0)
        .tickPadding(10)
        .ticks(Math.floor(width / 80))
        .tickFormat(d3.timeFormat('%b %Y'))
      );

    svg.append('g')
      .call(d3.axisLeft(yScale)
        .tickSize(0)
        .tickFormat(d3.format(".2s"))
      );

    // Add Y-Axis Label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2) 
      .attr('y', -margin.left + 10) 
      .attr('text-anchor', 'middle') 
      .style('font-size', '12px') 
      .style('fill', '#333') 
      .text(`Price (${filteredData[0]?.currency_code || ''})`);

    // Y-axis grid lines
    const yGrid = d3.axisLeft(yScale)
      .tickSize(-width) 
      .tickFormat('');

    // Append the grid lines to the SVG
    svg.append('g')
      .attr('class', 'grid')
      .call(yGrid);

    // Add lines
    const line = d3
      .line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.price));

    // Add lines
    const lines = svg
      .selectAll('.line')
      .data(aggregatedData)
      .enter()
      .append('path')
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', d => colorScale(d.commodity_code))
      .attr('stroke-width', 2)
      .attr('d', d => line(d.values))
      .style('opacity', 1);

    // Add commodity name labels at the end of the lines
    const labels = svg
        .selectAll('.line-label')
        .data(aggregatedData)
        .enter()
        .append('text')
        .attr('class', 'line-label')
        .attr('x', d => xScale(d.values[d.values.length - 1].date)) 
        .attr('y', d => yScale(d.values[d.values.length - 1].price))
        .attr('dx', 5) 
        .attr('dy', 4) 
        .style('fill', d => colorScale(d.commodity_code)) 
        .style('cursor', 'pointer') 
        .text(d => d.commodity_name)
        .on('mouseover', function (event, d) {
          // Fade all lines and labels
          lines.style('opacity', 0.2); 
          labels.style('opacity', 0.2);
          d3.select(this).style('opacity', 1); // Highlight the hovered label
          svg
            .selectAll('.line')
            .filter(lineData => lineData.commodity_code === d.commodity_code)
            .style('opacity', 1)
            .raise(); // Bring the corresponding line to the front
        })
        .on('mouseout', function () {
          // Reset all lines and labels
          lines.style('opacity', 1);
          labels.style('opacity', 1);
        });

    // Tooltip container
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0);

    // Vertical line
    const verticalLine = svg.append('line')
      .attr('stroke', '#999')
      .attr('stroke-dasharray', '4 4')
      .attr('y1', 0)
      .attr('y2', height)
      .style('opacity', 0);

    // Mouse interaction overlay
    const overlay = svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all');

    const bisectDate = d3.bisector(d => d.date).left;

    overlay.on('mousemove', (event) => {
      const mouseX = d3.pointer(event, this)[0];
      const hoveredDate = xScale.invert(mouseX);

      // Find the closest data for each line
      const tooltipData = aggregatedData.map(d => {
        const index = bisectDate(d.values, hoveredDate);
        const closestPoint = d.values[Math.max(0, Math.min(index, d.values.length - 1))];
        //const closestPrice = `${(closestPoint.date.getTime() <= hoveredDate.getTime()) ? closestPoint.price : 'NA'} per ${d.unit}`;

        return { commodity_name: d.commodity_name, unit: d.unit, price: closestPoint.price, date: closestPoint.date };
      }).sort((a, b) => b.price - a.price); 

      // Update vertical line
      verticalLine
        .attr('x1', xScale(hoveredDate))
        .attr('x2', xScale(hoveredDate))
        .style('opacity', 1);

      // Update tooltip
      tooltip
        .style('opacity', 1)
        .html(`
          <strong>${d3.timeFormat('%b %Y')(hoveredDate)}</strong><br>
          ${tooltipData.map(d => `${d.commodity_name}: ${formatNum(d.price)} per ${d.unit}`).join('<br>')}
        `)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 50}px`);
    });

    overlay.on('mouseout', () => {
      tooltip.style('opacity', 0);
      verticalLine.style('opacity', 0);
    });
  };


  // Re-render the chart on mount and when data/admin2_name changes
  onMount(() => {
    if (admin2Names.length > 0) {
      selectedAdmin2 = admin2Names[0]; // Set initial selection
      renderChart();
    }
  });
</script>


<label for="admin2-dropdown">Food prices for</label>
<select id="admin2-dropdown" bind:value={selectedAdmin2}>
  <option value="" disabled>Select an option</option>
  {#each admin2Names as admin2}
    <option value={admin2}>{admin2}</option>
  {/each}
</select>
<!-- <span> from {formatTime(minDate)} to {formatTime(maxDate)}</span> -->


<div bind:this={chartRef} class="chart"></div>


<style>
  .chart {
    display: flex;
    justify-content: flex-start;
    align-items: flex-center;
  }
  select {
    border: 0;
    border-bottom: 1px solid #111;
    margin: 0 5px;
    outline: 0;
    padding: 5px;
  }
  path.line {
    transition: opacity 0.3s ease-in-out; /* Smooth fading effect */
  }
</style>
