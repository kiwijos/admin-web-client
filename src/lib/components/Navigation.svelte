<script lang="ts">
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { Avatar } from '@skeletonlabs/skeleton';
	import { brand } from '$lib/config';

	const paths = [
		{ name: 'Översikt', path: '/admin/dashboard' },
		{ name: 'Karttjänster', path: '/admin/map' },
		{ name: 'Användare', path: '/admin/users', icon: '' }
	];

	const drawerStore = getDrawerStore();

	function drawerClose(): void {
		drawerStore.close();
	}
</script>

<div
	role="navigation"
	class="flex flex-col h-full divide-y divide-surface-2 dark:divide-surface-800"
>
	{#if $page.data.user}
		<a
			href="/me/account"
			class="flex px-4 py-3 hover:bg-surface-200 dark:hover:bg-surface-700 dark:text-surface-200 dark:hover:text-white"
		>
			<div><Avatar width="w-10" initials={$page.data.user.email[0]} /></div>
			<div class="overflow-auto">
				<span class="ms-3 block text-sm text-surface-900 truncate dark:text-white">Namn</span>
				<span class="ms-3 block text-sm text-surface-500 truncate dark:text-surface-400"
					>{$page.data.user.email}</span
				>
			</div>
		</a>
		<ul>
			{#each paths as { name, path, icon }}
				{@const active = $page.url.pathname === path ? 'page' : null}
				{@const activeClass =
					$page.url.pathname === path ? 'bg-surface-200 dark:bg-surface-800' : ''}
				<li>
					<a
						class="flex px-4 py-2 text-sm text-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700 dark:text-surface-200 dark:hover:text-white {activeClass}"
						aria-current={active}
						href={path}
						on:click={drawerClose}
					>
						<span class="ms-3">{name}</span>
					</a>
				</li>
			{/each}
		</ul>
		<form action="/logout" method="POST" use:enhance>
			<button
				type="submit"
				class="block w-full px-4 py-2 text-sm text-left text-surface-700 hover:bg-surface-200 dark:hover:bg-surface-700 dark:text-surface-200 dark:hover:text-white"
				><span class="ms-3">Logga ut</span></button
			>
		</form>
	{:else}
		<a href="/login" class="btn btn-lg variant-filled-primary">Logga in</a>
	{/if}
	<!-- The div will grow to fit any space -->
	<div class="grow"></div>
	<!-- This is a hack to make the footer stick to the bottom -->

	<div class="p-4">
		<p class="text-sm text-left text-surface-500">Powered by</p>
		<a
			class="block font-extrabold text-2xl text-secondary-500"
			href="/"
			target="_blank"
			rel="noopener">{brand}</a
		>
	</div>
</div>
