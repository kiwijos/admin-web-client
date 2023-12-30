<script lang="ts">
	import type { PageData } from './$types';
	import ChargeMeter from '$lib/components/ChargeMeter.svelte';

	export let data: PageData;
</script>

{#await data.bikes}
	<div class="w-full h-full flex items-center justify-center placeholder animate-pulse">
		Hämtar cyklar...
	</div>
{:then bikes}
	{#if bikes.length === 0}
		<p class="text-xs text-surface-400">Inga cyklar hittades</p>
	{:else}
		<div class="relative overflow-x-auto">
			<table class="w-full text-md text-left text-surface-400 dark:text-surface-300">
				<thead
					class="text-xs text-surface-700 uppercase bg-gray-50 dark:text-surface-300 dark:bg-surface-600"
				>
					<tr>
						<th class="px-6 py-3"><span class="sr-only">ID</span></th>
						<th class="px-6 py-3">Stad</th>
						<th class="px-6 py-3">Hyrstatus</th>
						<th class="px-6 py-3">Batteri</th>
						<th class="px-6 py-3 table-cell-fit">Status</th>
						<th class="px-6 py-3">
							<span class="sr-only">Aktivera/Stoppa</span>
						</th>
					</tr>
				</thead>
				<tbody class="overflow-y-scroll text-sm" data-sveltekit-preload-data="false">
					{#each bikes as bike, i}
						<tr
							class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800"
						>
							<td class="px-6 py-4 table-cell-fit">{bike.id}</td>
							<td class="px-6 py-4">{bike.city_id} </td>
							<td class="px-6 py-4">{bike.status_descr} </td>
							<td class="px-6 py-4 grid gap-2 grid-cols-2 items-center"
								><ChargeMeter fraction={bike.charge_perc} /><span
									>{Math.round(bike.charge_perc * 100)}%</span
								>
							</td>
							<td class="px-6 py-4">{bike.active ? 'Aktiv' : 'Inaktiv'} </td>
							<td class="px-6 py-4 table-cell-fit"> Stop </td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
{:catch error}
	<p>Fel vid hämtning av cyklar: {error.message}</p>
{/await}
