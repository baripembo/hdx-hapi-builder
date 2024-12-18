<!-- src/components/LoadingMessage.svelte -->
<script>
  import { loadingMessage } from "../lib/store";
</script>

<div id="loading-message">
  {$loadingMessage}
</div>
