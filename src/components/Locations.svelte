<script>
  import { onMount } from 'svelte';

  export let data;
  export let startYear = "2024";
  export let endYear = "2025";
  export let updateParams;

  const minYear = "1998";
  const maxYear = "2025";

  const formatYearOptions = (start, end) => {
    const minYear = Number(start);
    const maxYear = Number(end);
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
    return years.reverse();
  };

  const yearOptions = formatYearOptions(minYear, maxYear);


  onMount(() => {
    // Set default select values
    const startSelect = document.getElementById("start-year");
    const endSelect = document.getElementById("end-year");
    startSelect.value = startYear;
    endSelect.value = endYear;
  });
</script>

<h1>Priority Humanitarian Locations</h1>

<div class="date-filter">
  <label for="start-year">Start Year:</label>
  <select id="start-year" bind:value="{startYear}">
    {#each yearOptions as year}
      <option value="{year}">{year}</option>
    {/each}
  </select>

  <label for="end-year">End Year:</label>
  <select id="end-year" bind:value="{endYear}">
    {#each yearOptions as year}
      <option value="{year}">{year}</option>
    {/each}
  </select>
</div>

<ul>
  {#each data.locations as loc}
    <li><a href={`./index.html?type=location&code=${loc.code}&start_date=${startYear}&end_date=${endYear}`}>{loc.name}</a></li>
  {/each}
</ul>
