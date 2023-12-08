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

<div role="navigation" class="divide-y divide-surface-2 dark:divide-gray-600">
	{#if $page.data.user}
		<a
			href="/me/account"
			class="flex px-4 py-3 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
		>
			<div><Avatar width="w-10" initials={$page.data.user.email[0]} /></div>
			<div class="overflow-auto">
				<span class="ms-3 block text-sm text-gray-900 truncate dark:text-white">Name</span>
				<span class="ms-3 block text-sm text-gray-500 truncate dark:text-gray-400"
					>{$page.data.user.email}</span
				>
			</div>
		</a>
		<ul>
			{#each paths as { name, path }}
				{@const active = $page.url.pathname === path ? 'page' : null}
				{@const activeClass =
					$page.url.pathname === path
						? 'btn w-full justify-start variant-soft-primary '
						: 'btn w-full justify-start hover:variant-soft-primary'}
				<li>
					<a
						class="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
						aria-current={active}
						href={path}
						on:click={drawerClose}>{name}</a
					>
				</li>
			{/each}
		</ul>
		<form action="/logout" method="POST" use:enhance>
			<button
				type="submit"
				class="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
				>Logga ut</button
			>
		</form>
	{:else}
		<a href="/login" class="btn btn-lg variant-filled-primary">Logga in</a>
	{/if}
</div>
