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
{:then bikes}
	{#if bikes.length === 0}
		<p class="text-xs text-surface-400">Inga cyklar hittades.</p>
	{:else}
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
						<th class="px-6 py-3"><span class="sr-only">ID</span></th>
						<th class="px-6 py-3">Stad</th>
						<th class="px-6 py-3">Status</th>
						<th class="px-6 py-3">Batteri</th>
						<th class="px-6 py-3"><span class="sr-only">Aktiv</span></th>
					</tr>
				</thead>
				<tbody class="overflow-y-scroll text-sm" data-sveltekit-preload-data="false">
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
							<td class="px-6 py-4 w-48">{bike.city_id} </td>
							<td class="px-6 py-4">{statusCodes[bike.status_id]} </td>
							<td class="px-6 py-4 grid gap-2 grid-cols-[1fr,auto] items-center min-w-48"
								><ChargeMeter fraction={bike.charge_perc} /><span
									>{Math.round(bike.charge_perc * 100)}%</span
								>
							</td>
							<td class="px-6 w-48 text-right">
								{#if bike.active}
									<span class="rounded-full px-2 py-1 variant-soft-success">Aktiv</span>
								{:else}
									<span class="rounded-full px-2 py-1 variant-soft-error">Avstängd</span>
								{/if}
							</td></tr
						>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
{:catch error}
	<p>Fel vid hämtning av cyklar: {error.message}</p>
{/await}
