<script>
  import Locations from '../components/Locations.svelte';
  import Location from '../components/Location.svelte';
  import LoadingMessage from '../LoadingMessage.svelte';
  import { renderLocations, renderLocation } from "../lib/hapiUtils";

  export let pageType;
  export let params;

  let data = null;

  const fetchData = async () => {
    if (pageType === "locations") {
      data = await renderLocations(params.filter);
    } else if (pageType === "location") {
      const pcode = params.code;
      const start_date = params.start_date;
      const end_date = params.end_date;
      data = await renderLocation(pcode, start_date, end_date);
    }
  };

  fetchData();
</script>

{#if !data}
  <LoadingMessage />
{:else}
  {#if pageType === "locations"}
    <Locations {data} />
  {:else if pageType === "location"}
    <Location data={data} />
  {/if}
{/if}
