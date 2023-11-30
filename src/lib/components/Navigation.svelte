<script lang="ts">
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { Avatar } from '@skeletonlabs/skeleton';

	const paths = [
		{ name: 'Dashboard', path: '/admin/dashboard' },
		{ name: 'Map', path: '/admin/map' },
		{ name: 'Users', path: '/admin/users' }
	];

	const drawerStore = getDrawerStore();

	function drawerClose(): void {
		drawerStore.close();
	}
</script>

<nav class="flex flex-col space-y-8 p-4">
	{#if $page.data.user}
		<div class="flex flex-col items-center justify-center space-y-2">
			<Avatar
				initials={$page.data.user.email[0]}
				border="border-4 border-surface-300-600-token hover:!border-primary-500"
				cursor="cursor-pointer"
			/>
			<p class="font-bold text-primary-500">{$page.data.user.email}</p>
		</div>
		<form action="/logout" method="POST" use:enhance>
			<button type="submit" class="w-full btn variant-ghost">Log out</button>
		</form>
		<ul>
			{#each paths as { name, path }}
				{@const active = $page.url.pathname === path ? 'page' : null}
				{@const activeClass = $page.url.pathname === path ? 'btn w-full justify-start variant-soft-secondary ' : 'btn w-full justify-start hover:variant-soft-secondary'}
				<li>
					<a class={activeClass} aria-current={active} href={path} on:click={drawerClose}>{name}</a>
				</li>
			{/each}
		</ul>
		
	{:else}
		<a href="/login" class="btn btn-lg variant-filled-primary">Sign in</a>
	{/if}
</nav>
