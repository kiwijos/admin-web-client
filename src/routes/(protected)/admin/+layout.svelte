<script lang="ts">
	import { AppShell } from '@skeletonlabs/skeleton';
	import { Drawer, getDrawerStore } from '@skeletonlabs/skeleton';
	import Navigation from '$lib/components/Navigation.svelte';

	const drawerStore = getDrawerStore();

	function drawerOpen(): void {
		drawerStore.open({});
	}
</script>

<!-- The drawer overlays the page when active -->
<Drawer width="w-52" bgDrawer="bg-white dark:bg-surface-800">
	<Navigation />
</Drawer>

<AppShell
	slotSidebarLeft="bg-white dark:bg-transparent w-0 lg:w-52 border-r border-r-gray-100 dark:border-r-surface-600"
>
	<svelte:fragment slot="header">
		<button
			class="absolute lg:hidden btn-icon btn-sm bg-primary-500 right-0 mt-2 mr-4 z-10"
			on:click={drawerOpen}
		>
			<span>
				<svg viewBox="0 0 100 80" class="fill-white w-8 h-4">
					<rect width="100" height="12" />
					<rect y="30" width="75" height="12" />
					<rect y="60" width="100" height="12" />
				</svg>
			</span>
		</button>
	</svelte:fragment>
	<slot />
	<svelte:fragment slot="sidebarLeft">
		<Navigation />
	</svelte:fragment>
</AppShell>
