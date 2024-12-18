<script>
  import Map from "../components/Map.svelte";
  import KeyFigure from "../components/KeyFigure.svelte";
  import PageRenderer from "../components/PageRenderer.svelte";
  import LineChart from "../components/charts/LineChart.svelte";
  import Table from "../components/charts/Table.svelte";
  import { renderLocations, renderLocation } from "../lib/renderFunctions";
  import { pageInfo } from "../lib/store";

  export let pageType;
  export let params;

  let template;
  let fetchFunction;
  let currentView = "charts";

  let selectedCommodities = new Set();
  let commodityList = [];

  // Define `data` from $pageInfo.food_price.data
  $: data = $pageInfo?.food_price?.data || [];

  // Extract unique commodities, excluding 'non-food' categories
  $: commodityList = Array.from(
    new Set(
      data
        .filter(d => d.commodity_category !== 'non-food') // Exclude non-food
        .map(d => d.commodity_name)
    )
  ).sort();

  // Initialize all commodities as selected
  $: if (commodityList.length > 0 && selectedCommodities.size === 0) {
    commodityList.forEach((commodity) => selectedCommodities.add(commodity));
  }

  // Filter data for the selected commodities
  $: filteredData = data.filter(
    (d) => 
      selectedCommodities.has(d.commodity_name) &&
      d.commodity_category !== 'non-food'
  );

  // Toggle commodity selection
  const toggleCommodity = (commodity) => {
    // Create a new Set to trigger reactivity
    selectedCommodities = new Set(selectedCommodities);

    if (selectedCommodities.has(commodity)) {
      selectedCommodities.delete(commodity);
    } else {
      selectedCommodities.add(commodity);
    }
  };

  if (pageType === "locations") {
    template = (info) => `<h1>Priority Humanitarian Locations</h1><ul>${info.locations.map((loc) => `<li><a href='./index.html?type=location&code=${loc.code}'>${loc.name}</a></li>`).join("")}</ul>`;
    fetchFunction = () => renderLocations(params.filter);
  } else if (pageType === "location") {
    template = (info) => {
      //console.log('info', info);
      return `
        <h1>${info.location.name}</h1>
        <h2 class='header'>Food Prices</h2>
        ${info.food_price_by_market
          ? '<div id="map-container"></div>'
          : '<p>No food prices to display on the map.</p>'}
      `;
    };
    fetchFunction = async () => {
      const pcode = params.code;
      return await renderLocation(pcode);
    };
  }

  const switchView = (view) => {
    currentView = view;
  };
</script>


<PageRenderer {template} {fetchFunction} />

{#if $pageInfo?.food_price}
  <div class='grid-container'>
    <div class='col-3'>
      <!-- Checkboxes on the left -->
      <div class="checkbox-list">
        <h4>Commodities</h4>
        {#each commodityList as commodity}
          <label class="checkbox-item">
            <input
              type="checkbox"
              checked={selectedCommodities.has(commodity)}
              on:change={() => toggleCommodity(commodity)}
            />
            {commodity}
          </label>
        {/each}
      </div>
    </div>

    <div class='col-9'>
      <!-- Buttons for toggling views -->
      <div class="button-container">
        <button
          on:click={() => switchView("charts")}
          class:active={currentView === "charts"}>
            Charts
        </button>
        <button 
          on:click={() => switchView("table")}
          class:active={currentView === "table"}>
            Table
        </button>
        <button on:click={() => switchView("map")}
          class:active={currentView === "map"}>
            Map
        </button>
      </div>

      <!-- Conditional rendering based on currentView -->
      {#if currentView === "charts"}
        <LineChart data={filteredData} key={filteredData.length} />
      {/if}
      {#if currentView === "table"}
        <Table data={filteredData} key={filteredData.length} />
      {/if}
      {#if currentView === "map"}
        <Map data={$pageInfo.food_price_by_market} admin2_name="{'Fayzabad'}" />
      {/if}

      <!-- Key figures -->
      <div class='keyfigure-container'>
        <KeyFigure title={'Number of commodities'} value={selectedCommodities.size} />
      </div>
    </div>
  </div>

{/if}

<style>
  .button-container {
    margin-bottom: 20px;
  }
  .keyfigure-container {
    margin-top: 20px;
  }
  .checkbox-list {
    display: flex;
    flex-direction: column;
    margin-right: 10px;
  }
  .checkbox-item {
    margin-bottom: 5px;
  }
</style>
