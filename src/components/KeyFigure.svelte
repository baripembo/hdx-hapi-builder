<script>
  import * as d3 from 'd3';

  export let title = 'Key figure';
	export let valueFormat = '.2s';
	export let value = 0;
	export let metadata;
	export let endpoint;

	let dateFormat = d3.utcFormat("%b %d, %Y");
	let keyFigInner, containerWidth, chartWidth, chartHeight;

	//key figure value
	$: keyVal = (value!==undefined) ? value.toString().replace(/,/g, '') : value;
	$: keyVal = (keyVal>0) ? d3.format(valueFormat)(keyVal).replace(/G/, 'B') : keyVal;
</script>

<div class='key-figure'>
	<h3>{title}</h3>
	<div class='key-figure-inner' bind:this={keyFigInner} bind:clientWidth={containerWidth}>
		<span class='num' bind:clientWidth={chartWidth} bind:clientHeight={chartHeight}>{keyVal}</span>
<!-- 		{#if series && keyFigInner}
			{#if seriesType=='column'}
				<Column data={series} width={containerWidth-chartWidth} height={chartHeight - 10} />
			{:else if seriesType=='pie'}
				<Pie data={series} width={containerWidth-chartWidth} height={chartHeight - 10} />
			{:else}
				<Sparkline data={series} width={containerWidth-chartWidth} height={chartHeight - 5} />
			{/if}
		{/if} -->
	</div>
	<!-- <Source metadata={metadata} endpoint={endpoint} /> -->
</div>


<style lang='scss'>
	.key-figure {
 		padding-bottom: 15px;
 		.key-figure-inner {
    	align-items: center;
 			display: flex;
    	margin: 15px 0;
 		}
		.num {
			display: block;
			font-family: 'Gotham-Light', sans-serif;
			font-size: 48px;
			line-height: 48px;
			padding-right: 10px;
		}
	}
	.col-2,
	.col-6 {
		.key-figure {
			h3 {
 				min-height: 42px;
			}
		}
	}
</style>