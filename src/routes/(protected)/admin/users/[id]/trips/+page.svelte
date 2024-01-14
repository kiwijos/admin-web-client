<script lang="ts">
	import type { PageData } from './$types';
	import { formatDateReadable, calculateTimeDifference } from '$lib/services/dateFormatter';

	export let data: PageData;
	console.log(data);
</script>

{#await data.trips}
	<div class="w-full h-full flex items-center justify-center placeholder animate-pulse">
		Hämtar resor...
	</div>
{:then trips}
	<div class="relative overflow-x-auto">
		<table class="w-full text-md text-left text-surface-400 dark:text-surface-300">
			<thead
				class="text-xs text-surface-700 uppercase bg-gray-50 dark:text-surface-300 dark:bg-surface-600"
			>
				<tr>
					<th class="px-6 py-3">Resenr.</th>
					<th class="px-6 py-3">Cykelnr.</th>
					<th class="px-6 py-3">Startdatum</th>
					<th class="px-6 py-3">Slutdatum</th>
					<th class="px-6 py-3 table-cell-fit">Resetid</th>
					<th class="px-6 py-3">Startavgift</th>
					<th class="px-6 py-3">Tidsavgift</th>
					<th class="px-6 py-3">Parkering</th>
					<th class="px-6 py-3 table-cell-fit">Total kostnad</th>
				</tr>
			</thead>
			<tbody class="overflow-y-scroll text-sm" data-sveltekit-preload-data="false">
				{#each trips as trip}
					<tr class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800">
						<td class="px-6 py-4">{trip.id} </td>
						<td class="px-6 py-4"
							><a
								href="/admin/bikes/{trip.bike_id}"
								class="font-medium text-secondary-500 hover:underline whitespace-nowrap"
								>Cykel {trip.bike_id}</a
							></td
						>
						<td class="px-6 py-4 whitespace-nowrap">{formatDateReadable(trip.start_time)}</td>

						<td class="px-6 py-4 whitespace-nowrap">{formatDateReadable(trip.end_time)}</td>
						<td class="px-6 py-4 table-cell-fit text-center"
							>{calculateTimeDifference(trip.start_time, trip.end_time)}</td
						>
						<td class="px-6 py-4 table-cell-fit text-right">{trip.start_cost} kr </td>
						<td class="px-6 py-4 table-cell-fit text-right">{trip.var_cost} kr </td>
						<td class="px-6 py-4 table-cell-fit text-right">{trip.park_cost} kr </td>
						<td class="px-6 py-4 table-cell-fit text-right">{trip.total_cost} kr </td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/await}
