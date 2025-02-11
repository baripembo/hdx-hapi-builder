<script>
  import KeyFigure from "../components/KeyFigure.svelte";
  import LineChart from "../components/charts/LineChart.svelte";
  import Map from "../components/Map.svelte";
  import Table from "../components/charts/Table.svelte";

  export let data;

  let foodData;
  let currentView = "charts";
  let selectedCommodities = new Set();
  let commodityList = [];
  let foodPriceByMarket = data.food_price_by_market;
  let location = data.location;

  $: foodData = data.food_price.data || [];

  // Extract unique commodities, excluding 'non-food' categories
  $: commodityList = Array.from(
    new Set(
      foodData
        .filter(d => d.commodity_category !== 'non-food')
        .map(d => d.commodity_name)
    )
  ).sort();

  // Initialize all commodities as selected
  $: if (commodityList.length > 0 && selectedCommodities.size === 0) {
    commodityList.forEach((commodity) => selectedCommodities.add(commodity));
  }

  // Filter data for the selected commodities
  $: filteredData = foodData.filter(
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

  // Switch view (charts, table, map)
  const switchView = (view) => {
    currentView = view;
  };
</script>

<a href="/hdx-hapi-builder/">Back to index</a>
<h1>{location.name}</h1>
<h2 class="header">Food Prices</h2>

<!-- Commodities Section -->
<div class="grid-container">
  <div class="col-3">
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

  <div class="col-9">
    <!-- View Buttons -->
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
      <button
        on:click={() => switchView("map")}
        class:active={currentView === "map"}>
        Map
      </button>
    </div>

    <!-- Conditional Rendering of Views -->
    {#if currentView === "charts"}
      <LineChart data={filteredData} key={filteredData.length} />
    {/if}
    {#if currentView === "table"}
      <Table data={filteredData} key={filteredData.length} />
    {/if}
    {#if currentView === "map"}
      <Map data={foodPriceByMarket} admin2_name="{location?.admin2_name}" />
    {/if}

    <!-- Key Figures -->
    <div class="keyfigure-container">
      <KeyFigure title="Number of commodities" value={selectedCommodities.size} />
    </div>
  </div>
</div>

<style>
  .button-container {
    margin-bottom: 20px;
  }
  .keyfigure-container {
    margin-top: 20px;
  }
</style>
