<script lang="ts">
	import { getDrawerStore } from '@skeletonlabs/skeleton';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { Avatar } from '@skeletonlabs/skeleton';
	import { brand } from '$lib/config';

	import Fa from 'svelte-fa';
	import {
		faUsersCog,
		faMapLocation,
		faChartPie,
		faSignOutAlt
	} from '@fortawesome/free-solid-svg-icons';

	const paths = [
		{ name: 'Översikt', path: '/admin/dashboard', icon: faChartPie, subpaths: [] },
		{
			name: 'Kartor',
			path: '/admin/map',
			icon: faMapLocation,
			subpaths: [
				{ name: 'Zoner', path: '/admin/map/zones' },
				{ name: 'Cyklar', path: '/admin/map/live' }
			]
		},
		{
			name: 'Användare',
			path: '/admin/users',
			icon: faUsersCog,
			subpaths: [
				{ name: 'Sök användare', path: '/admin/users/search' },
				{ name: 'Betalningar', path: '/admin/users/transactions' },
				{ name: 'Resor', path: '/admin/users/trips' }
			]
		}
	];

	const drawerStore = getDrawerStore();

	function drawerClose(): void {
		drawerStore.close();
	}

	const activeClass = 'bg-gray-100 dark:bg-surface-700 dark:!text-white';
</script>

<div
	role="navigation"
	class="flex flex-col h-full divide-y divide-gray-100 dark:divide-surface-700"
	data-sveltekit-preload-data="false"
>
	{#if $page.data.user}
		<a
			href="/admin/account"
			class="flex px-4 py-2 hover:bg-gray-100 dark:hover:bg-surface-700 dark:text-surface-200 dark:hover:text-white"
			on:click={drawerClose}
		>
			<div>
				<Avatar
					width="w-10"
					background="bg-gray-100 dark:bg-surface-500"
					initials={$page.data?.user?.id ?? '?'}
				/>
			</div>
			<div class="overflow-auto">
				<span class="ms-3 block text-sm text-surface-900 truncate dark:text-white">Namn</span>
				<span class="ms-3 block text-sm text-surface-400 truncate dark:text-surface-400"
					>{$page.data.user.id}</span
				>
			</div>
		</a>
		<ul>
			{#each paths as { name, path, icon, subpaths }}
				{@const active = $page.url.pathname === path ? 'page' : null}
				<li>
					<ul>
						<a
							class="flex items-center px-4 py-2 text-sm text-surface-700 hover:bg-gray-100 dark:hover:bg-surface-700 dark:text-surface-100 dark:hover:text-white {$page
								.url.pathname === path
								? activeClass
								: ''}"
							aria-current={active}
							href={path}
							on:click={drawerClose}
						>
							<Fa {icon} />
							<span class="ms-3">{name}</span>
						</a>
						{#each subpaths as { name, path }}
							{@const active = $page.url.pathname === path ? 'page' : null}
							<li>
								<a
									class="flex px-4 py-2 text-sm text-surface-400 hover:bg-gray-100 dark:hover:bg-surface-700 dark:text-surface-300 dark:hover:text-white {$page
										.url.pathname === path
										? activeClass
										: ''}"
									aria-current={active}
									href={path}
									on:click={drawerClose}
								>
									<span class="ms-7">{name}</span>
								</a>
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
		<form action="/logout" method="POST" use:enhance>
			<button
				type="submit"
				class="flex items-center w-full px-4 py-2 text-sm text-left text-surface-700 hover:bg-gray-100 dark:hover:bg-surface-700 dark:text-surface-200 dark:hover:text-white"
				><Fa icon={faSignOutAlt} /><span class="ms-3">Logga ut</span></button
			>
		</form>
	{:else}
		<a href="/login" class="btn btn-lg variant-filled-primary">Logga in</a>
	{/if}
	<!-- The div will grow to fit any space -->
	<div class="grow"></div>
	<!-- This is a hack to make the footer stick to the bottom -->

	<div class="p-4">
		<p class="text-sm text-left text-surface-400 dark:text-surface-300">Powered by</p>
		<a class="block font-extrabold text-2xl dark:text-surface-100" href="/" target="_blank"
			>{brand}</a
		>
	</div>
</div>
