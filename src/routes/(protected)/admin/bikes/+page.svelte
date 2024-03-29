<script lang="ts">
	import type { PageData } from './$types';
	import ChargeMeter from '$lib/components/ChargeMeter.svelte';
	import type { PaginationSettings } from '@skeletonlabs/skeleton';

	import { Paginator } from '@skeletonlabs/skeleton';
	import { statusCodes } from '$lib/help/statusCodes';

	export let data: PageData;

	// Slice the data to fit the pagination
	// let sourceBodySliced: Trip[];
	$: sourceBodySliced = data?.bikes.slice(
		paginationSettings.page * paginationSettings.limit,
		paginationSettings.page * paginationSettings.limit + paginationSettings.limit
	);

	let size: number;
	$: size = data?.bikes.length;

	// Same goes for the pagination settings
	let paginationSettings: PaginationSettings;
	$: paginationSettings = {
		page: 0,
		limit: 50,
		size: size,
		amounts: [5, 10, 50, 100, 500, 1000]
	};
</script>

{#await data.bikes}
	<div class="w-full h-full flex items-center justify-center placeholder animate-pulse">
		Hämtar cyklar...
	</div>
{:then}
	<div class="bg-surface-50 dark:bg-transparent p-8">
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
	<div class="relative overflow-x-auto">
		<table class="w-full text-md text-left text-surface-400 dark:text-surface-300">
			<thead
				class="text-xs text-surface-700 uppercase bg-gray-50 dark:text-surface-300 dark:bg-surface-600"
			>
				<tr>
					<th class="px-6 py-3 w-24"><span class="sr-only">Cykel-ID</span></th>
					<th class="px-6 py-3 table-cell-fit"><span class="sr-only">Aktiv</span></th>
					<th class="px-6 py-3 w-72">Status</th>
					<th class="px-6 py-3 min-w-48 max-w-72">Batteri</th>
					<th class="px-6 py-3 w-48">Stad</th>
					<th class="px-6 py-3 w-96">Position</th>
					<th class="px-6 py-3"><span class="sr-only">Redigera</span></th>
				</tr>
			</thead>
			<tbody class="overflow-y-scroll text-sm" data-sveltekit-preload-data="false">
				{#if sourceBodySliced.length === 0}
					<tr>
						<td colspan="7" class="px-6 py-4 text-center">Inga cyklar hittades.</td>
					</tr>
				{:else}
					{#each sourceBodySliced as bike}
						<tr
							class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800"
						>
							<td class="px-6 py-4 w-24"
								><a
									href="/admin/bikes/{bike.id}"
									class="font-medium text-secondary-500 hover:underline whitespace-nowrap"
									>{bike.id}</a
								></td
							>
							<td class="table-cell-fit">
								<span
									class="inline-flex p-2 w-6 h-6 items-center justify-center text-xs font-semibold rounded-full {bike.active
										? 'bg-green-100 dark:bg-surface-500 text-green-800 dark:text-green-300'
										: 'bg-red-100 dark:bg-surface-500 text-red-800 dark:text-red-300'}"
									>{bike.active ? '✓' : '✕'}</span
								>
							</td>
							<td class="px-6 py-4 w-72">{statusCodes[bike.status_id]}</td>
							<td class="px-6 py-4 grid gap-2 grid-cols-[1fr,auto] items-center min-w-48 max-w-72"
								><ChargeMeter fraction={bike.charge_perc} /><span
									>{Math.round(bike.charge_perc * 100)}%</span
								>
							</td>
							<td class="px-6 py-4 w-48">{bike.city_id} </td>
							<td class="px-6 py-4 w-96 whitespace-nowrap"
								>Lat. {bike.coords[1].toFixed(4)}, Lon. {bike.coords[0].toFixed(4)}</td
							>
							<td class="px-6 py-4 w-24">
								<a
									href="/admin/bikes/{bike.id}"
									class="font-medium text-secondary-500 hover:underline whitespace-nowrap"
									>Redigera</a
								>
							</td></tr
						>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
{:catch error}
	<p>Fel vid hämtning av cyklar: {error.message}</p>
{/await}
