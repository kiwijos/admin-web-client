<script lang="ts">
	import type { PageData } from './$types';
	import type { PaginationSettings } from '@skeletonlabs/skeleton';
	import type { User } from '$lib/types/User';

	import { Paginator } from '@skeletonlabs/skeleton';

	import Fa from 'svelte-fa';
	import { faSearch } from '@fortawesome/free-solid-svg-icons';

	export let data: PageData;

	// Filter the data
	let filter: string = '';
	$: filteredBody = data?.users.filter((user: User) => {
		return (
			user.email.toLowerCase().includes(filter.toLowerCase()) ||
			String(user.id).toLowerCase().includes(filter.toLowerCase())
		);
	});

	// Filter function
	function filterUsers(event: Event) {
		filter = (event.target as HTMLInputElement).value;
	}

	// Slice the data to fit the pagination
	let sourceBodySliced: User[];
	$: sourceBodySliced = filteredBody.slice(
		paginationSettings.page * paginationSettings.limit,
		paginationSettings.page * paginationSettings.limit + paginationSettings.limit
	);

	let size: number;
	$: size = data?.users.length;

	// Same goes for the pagination settings
	let paginationSettings: PaginationSettings;
	$: paginationSettings = {
		page: 0,
		limit: 50,
		size: size,
		amounts: [5, 10, 50, 100, 500, 1000]
	};
</script>

<div class="bg-surface-50 dark:bg-transparent flex flex-col lg:flex-row gap-4 p-8">
	<div class="input-group grid-cols-[auto_1fr_auto] border-none">
		<div class="input-group-shim bg-white dark:bg-surface-600">
			<Fa size="sm" icon={faSearch} />
		</div>
		<input
			type="search"
			class="text-sm !bg-white dark:!bg-surface-700 focus:!ring-blue-500 dark:placeholder-surface-400 dark:text-white dark:focus:ring-blue-500"
			placeholder="Sök efter användare"
			on:input={filterUsers}
		/>
	</div>
	<Paginator
		bind:settings={paginationSettings}
		showFirstLastButtons={true}
		showPreviousNextButtons={true}
		amountText="per sida"
		separatorText="av"
		justify="justify-between"
		select="hover:cursor-pointer text-sm dark:bg-surface-600 rounded-3xl border-transparent"
		controlVariant="text-sm bg-white dark:bg-surface-600 border-transparent"
		class="sm:!flex-row gap-4 !space-x-0 !space-y-0 [&>label]:w-fit"
	/>
</div>
{#await data.users}
	<div class="w-full h-full flex items-center justify-center placeholder animate-pulse">
		Hämtar användare...
	</div>
{:then}
	<div class="relative overflow-x-auto">
		<table class="w-full text-md text-left text-surface-400 dark:text-surface-300">
			<thead
				class="text-xs text-surface-700 uppercase bg-gray-50 dark:text-surface-300 dark:bg-surface-600"
			>
				<tr>
					<th class="px-6 py-3 w-24"><span class="sr-only">Användar-ID</span></th>
					<th class="px-6 py-3 w-96">Mail</th>
					<th class="px-6 py-3 w-56">
						<span class="sr-only">Profil, Resor, Betalningar</span>
					</th>
					<th class="px-6 py-3 w-56 text-right">Saldo</th>
					<th><span aria-hidden class="sr-only">Utfyllnad</span></th>
				</tr>
			</thead>
			<tbody class="overflow-y-scroll text-sm" data-sveltekit-preload-data="false">
				{#if sourceBodySliced.length === 0}
					<tr>
						<td colspan="10" class="px-6 py-4 text-center">Inga användare hittades.</td>
					</tr>
				{:else}
					{#each sourceBodySliced as user}
						{@const negative = user.balance < 0}
						<tr
							class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800"
						>
							<td class="px-6 py-4 w-24"
								><a
									href="/admin/users/{user.id}"
									class="font-medium text-secondary-500 hover:underline">{user.id}</a
								></td
							>
							<td class="px-6 py-4 w-96"
								><a
									href="/admin/users/{user.id}"
									class="font-medium text-secondary-500 hover:underline">{user.email}</a
								></td
							>
							<td class="px-6 py-4 text-center w-56 whitespace-nowrap">
								<a
									href="/admin/users/{user.id}"
									class="font-medium text-secondary-500 hover:underline">Profil</a
								>,
								<a
									href="/admin/users/{user.id}/trips"
									class="font-medium text-secondary-500 hover:underline">Resor</a
								>,
								<a
									href="/admin/users/{user.id}/transactions"
									class="font-medium text-secondary-500 hover:underline">Betalningar</a
								>
							</td>
							<td class="px-6 py-4 w-56 whitespace-nowrap text-right"
								><span class="badge {negative ? ' variant-soft-error ' : 'variant-soft-success'}"
									>{user.balance} kr</span
								>
							</td>
							<td></td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
{:catch error}
	<div class="w-full h-full flex items-center justify-center">
		Fel vid hämtning av användare: {error.message}
	</div>
{/await}
