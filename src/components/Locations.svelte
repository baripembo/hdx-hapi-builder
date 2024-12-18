<!-- src/components/Locations.svelte -->
<script>
  import { onMount } from "svelte";
  import { renderLocations } from "../lib/renderFunctions";

  let filter = "hrp"; // Default filter
  let locations = [];
  let errorMessage = "";

  onMount(async () => {
    try {
      const result = await renderLocations(filter);
      locations = result.locations; // Assign fetched locations
    } catch (error) {
      errorMessage = "Failed to load locations.";
      console.error(error);
    }
  });

  function changeFilter(newFilter) {
    filter = newFilter;
    onMount(); // Reload data with new filter
  }
</script>

{#if errorMessage}
  <p class="error">{errorMessage}</p>
{:else if locations.length === 0}
  <p>Loading locations...</p>
{:else}
  <div>
    <h2>Locations</h2>
    <button on:click={() => changeFilter("hrp")}>HRP</button>
    <button on:click={() => changeFilter("gho")}>GHO</button>
    <ul>
      {#each locations as location}
        <li>{location.name}</li>
      {/each}
    </ul>
  </div>
{/if}

<style>
</style>