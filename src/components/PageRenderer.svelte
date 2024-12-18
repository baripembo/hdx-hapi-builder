<script>
  import { onMount } from "svelte";
  import { pageInfo } from "../lib/store";

  export let template;       // Template as a function
  export let fetchFunction;  // Data-fetching function

  let info = {};             // Holds the fetched data
  let isLoading = true;      // Loading state
  let errorMessage = "";     // Error state

  onMount(async () => {
    try {
      info = await fetchFunction(); // Fetch the data
      pageInfo.set(info);
      isLoading = false;
    } catch (error) {
      errorMessage = "Failed to load data.";
      console.error(error);
      isLoading = false;
    }
  });
</script>

{#if isLoading}
  <h2>Loading...</h2>
{:else if errorMessage}
  <p class="error">{errorMessage}</p>
{:else}
  {@html template(info)} <!-- Render the dynamic HTML -->
{/if}
