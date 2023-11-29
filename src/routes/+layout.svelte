<script lang="ts">
    import "../app.pcss";
    import { autoModeWatcher } from '@skeletonlabs/skeleton';
</script>
<svelte:head>{@html `<script>${autoModeWatcher.toString()} autoModeWatcher();</script>`}</svelte:head>
<slot></slot>