<script lang="ts">
	import type { PageData } from './$types';
	import type { PaginationSettings } from '@skeletonlabs/skeleton';
	import type { Trip } from '$lib/types/Trip';

	import { Paginator } from '@skeletonlabs/skeleton';
	import { calculateTimeDifference, formatDateReadable } from '$lib/services/dateFormatter';

	export let data: PageData;

	let fromDate: Date | undefined;
	let toDate: Date | undefined;

	let dateNow = String(new Date());

	let resetButtonActive: boolean;
	$: resetButtonActive = fromDate ? true : toDate ? true : false;

	function resetFilters() {
		fromDate = undefined;
		toDate = undefined;
		paginationSettings.page = 0;
	}

	function inputFromDate(event: Event) {
		fromDate = new Date((event.target as HTMLInputElement).value);
	}

	function inputToDate(event: Event) {
		toDate = new Date((event.target as HTMLInputElement).value);
		toDate.setDate(toDate.getDate() + 1); // Add one day to include the selected date
	}

	// Filter the data
	$: filteredBody = data?.trips.filter((trip: Trip) => {
		if (fromDate && toDate) {
			return new Date(trip.end_time) >= fromDate && new Date(trip.start_time) <= toDate;
		} else if (fromDate) {
			return new Date(trip.end_time) >= fromDate;
		} else if (toDate) {
			return new Date(trip.start_time) <= toDate;
		} else {
			return true;
		}
	});

	// Slice the data to fit the pagination
	let sourceBodySliced: Trip[];
	$: sourceBodySliced = filteredBody.slice(
		paginationSettings.page * paginationSettings.limit,
		paginationSettings.page * paginationSettings.limit + paginationSettings.limit
	);

	let size: number;
	$: size = data?.trips.length;

	// Same goes for the pagination settings
	let paginationSettings: PaginationSettings;
	$: paginationSettings = {
		page: 0,
		limit: 50,
		size: size,
		amounts: [5, 10, 50, 100, 500, 1000]
	};
</script>

{#await data.trips}
	<div class="w-full h-full flex items-center justify-center placeholder animate-pulse">
		Hämtar resor...
	</div>
{:then}
	<div class="bg-surface-50 dark:bg-transparent flex flex-col lg:flex-row gap-4 p-8">
		<div class="flex flex-col sm:flex-row gap-4 grow">
			<div class="input-group grid-cols-[auto_1fr_auto] border-none">
				<div class="input-group-shim bg-white dark:bg-surface-600 text-sm">Från</div>
				<input
					type="date"
					class="text-sm !bg-white dark:!bg-surface-700 focus:!ring-blue-500 dark:placeholder-surface-400 dark:text-white dark:focus:ring-blue-500"
					on:input|preventDefault={inputFromDate}
				/>
			</div>
			<div class="input-group grid-cols-[auto_1fr_auto] border-none">
				<div class="input-group-shim bg-white dark:bg-surface-600 text-sm">Till</div>
				<input
					type="date"
					class="text-sm !bg-white dark:!bg-surface-700 focus:!ring-blue-500 dark:placeholder-surface-400 dark:text-white dark:focus:ring-blue-500"
					on:input|preventDefault={inputToDate}
				/>
			</div>
		</div>
		<div class="flex flex-col sm:flex-row gap-4 items-center">
			<button
				class="btn bg-white dark:bg-surface-600 text-sm w-fit"
				disabled={!resetButtonActive}
				on:click={resetFilters}>Rensa filter</button
			>
			<Paginator
				bind:settings={paginationSettings}
				showFirstLastButtons={true}
				showPreviousNextButtons={true}
				amountText="per sida"
				separatorText="av"
				justify="justify-between"
				select="hover:cursor-pointer text-sm dark:bg-surface-600 rounded-3xl border-transparent"
				controlVariant="text-sm bg-white dark:bg-surface-600 border-transparent"
				class=" sm:!flex-row gap-4 !space-x-0 !space-y-0 [&>label]:w-fit"
			/>
		</div>
	</div>
	<div class="relative overflow-x-auto">
		<table class="w-full text-md text-left text-surface-400 dark:text-surface-300">
			<thead
				class="text-xs text-surface-700 uppercase bg-gray-50 dark:text-surface-300 dark:bg-surface-600"
			>
				<tr>
					<th class="px-6 py-3">Resenr.</th>
					<th class="px-6 py-3">Anv.</th>
					<th class="px-6 py-3">Cykelnr.</th>
					<th class="px-6 py-3">Startdatum</th>
					<th class="px-6 py-3">Slutdatum</th>
					<th class="px-6 py-3 table-cell-fit">Resetid</th>
					<th class="px-6 py-3">Startavgift</th>
					<th class="px-6 py-3">Tidsavgfit</th>
					<th class="px-6 py-3">Parkering</th>
					<th class="px-6 py-3 table-cell-fit">Total kostnad</th>
				</tr>
			</thead>
			<tbody class="overflow-y-scroll text-sm" data-sveltekit-preload-data="false">
				{#if sourceBodySliced.length === 0}
					<tr>
						<td colspan="10" class="px-6 py-4 text-center">Inga resor hittades.</td>
					</tr>
				{:else}
					{#each sourceBodySliced as trip}
						{@const hasEndTime = trip.end_time ? true : false}
						<tr
							class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800"
						>
							<td class="px-6 py-4">{trip.id} </td>
							<td class="px-6 py-4"
								><a
									href="/admin/users/{trip.user_id}"
									class="font-medium text-secondary-500 hover:underline">{trip.user_id}</a
								></td
							>
							<td class="px-6 py-4"
								><a
									href="/admin/bikes/{trip.bike_id}"
									class="font-medium text-secondary-500 hover:underline whitespace-nowrap"
									>{trip.bike_id}</a
								></td
							>
							<td class="px-6 py-4 whitespace-nowrap">{formatDateReadable(trip.start_time)}</td>

							<td class="px-6 py-4 whitespace-nowrap"
								>{hasEndTime ? formatDateReadable(trip.end_time) : '--'}</td
							>
							<td class="px-6 py-4 table-cell-fit text-center"
								>{!hasEndTime
									? `~${calculateTimeDifference(trip.start_time, dateNow)}`
									: calculateTimeDifference(trip.start_time, trip.end_time)}</td
							>
							<td class="px-6 py-4 table-cell-fit text-right"
								>{trip.start_cost ? `${trip.start_cost} kr` : '--'}</td
							>
							<td class="px-6 py-4 table-cell-fit text-right"
								>{trip.var_cost ? `${trip.var_cost.toFixed(2)} kr` : '--'}</td
							>
							<td class="px-6 py-4 table-cell-fit text-right"
								>{trip.park_cost ? `${trip.park_cost} kr` : '--'}</td
							>
							<td class="px-6 py-4 table-cell-fit text-right"
								>{trip.total_cost ? `${trip.total_cost.toFixed(2)} kr` : '--'}
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
{:catch error}
	<div class="w-full h-full flex items-center justify-center">
		Fel vid hämtning av resor: {error.message}
	</div>
{/await}
