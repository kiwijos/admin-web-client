<script lang="ts">
	import { AppShell } from '@skeletonlabs/skeleton';
	import { Drawer, getDrawerStore } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';
    import Navigation from '$lib/components/Navigation.svelte';

	const drawerStore = getDrawerStore();

	function drawerOpen(): void {
		drawerStore.open({});
	}
</script>

<!-- The drawer overlays the page when active -->
<Drawer class="z-2" >
    <Navigation />
</Drawer>

<AppShell
	regionPage="relative"
	slotSidebarLeft="bg-surface-500/5 w-0 lg:w-48 border border-transparent  border-r-surface-800"
	slotPageHeader="lg:hidden sticky top-0 z-10 bg-surface-500/5 drop-shadow-md p-2"
>
	<svelte:fragment slot="pageHeader"
		><div class="flex items-center justify-between">
			<button class="lg:hidden btn btn-sm mr-4" on:click={drawerOpen}>
				<span>
					<svg viewBox="0 0 100 80" class="fill-token w-4 h-4">
						<rect width="100" height="20" />
						<rect y="30" width="100" height="20" />
						<rect y="60" width="100" height="20" />
					</svg>
				</span>
			</button>
			{#if !$page.data.user}
				<div>
					<a class="btn variant-filled-primary" href="/login">Sign in</a>
				</div>
			{/if}
		</div></svelte:fragment
	>
	<slot />
	<svelte:fragment slot="sidebarLeft">
		<Navigation />
	</svelte:fragment>
</AppShell>
