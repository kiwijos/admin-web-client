<script lang="ts">
	import '../app.pcss';
	import { autoModeWatcher } from '@skeletonlabs/skeleton';
	import { initializeStores } from '@skeletonlabs/skeleton';

	import { LightSwitch } from '@skeletonlabs/skeleton';

	initializeStores();
</script>

<svelte:head>
	{@html `<script>${autoModeWatcher.toString()} autoModeWatcher();</script>`}
</svelte:head>
<slot />
<div class="fixed bottom-0 right-0 z-50 p-4">
	<LightSwitch />
</div>
