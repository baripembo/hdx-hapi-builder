<script>
  import Page from "./routes/Page.svelte";

  // Get the URL query parameters
  const urlParams = new URLSearchParams(window.location.search);

  // Extract page type and query parameters
  const pageType = urlParams.get("type") || "locations"; // Default to "locations"
  const params = Object.fromEntries(urlParams.entries());
</script>

<main>
  <Page {pageType} {params} />
</main>

<style>
</style>
