<script lang="ts">
	import type { PageData } from './$types';
	import { formatDateReadable } from '$lib/services/dateFormatter';

	export let data: PageData;
</script>

{#await data.transactions}
	<div class="w-full h-full flex items-center justify-center placeholder animate-pulse">
		Hämtar betalningar...
	</div>
{:then transactions}
	<div class="relative overflow-x-auto">
		<table class="w-full text-md text-left text-surface-400 dark:text-surface-300">
			<thead
				class="text-xs text-surface-700 uppercase bg-gray-50 dark:text-surface-300 dark:bg-surface-600"
			>
				<tr>
					<th class="px-6 py-3 table-cell-fit"><span class="sr-only">ID</span></th>
					<th class="px-6 py-3">Kort</th>
					<th class="px-6 py-3">Datum</th>
					<th class="px-6 py-3 table-cell-fit">Summa</th>
				</tr>
			</thead>
			<tbody class="overflow-y-scroll text-sm" data-sveltekit-preload-data="false">
				{#if transactions.length === 0}
					<tr>
						<td colspan="4" class="px-6 py-4 text-center">Inga betalningar hittades.</td>
					</tr>
				{:else}
					{#each transactions as transaction}
						<tr
							class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800"
						>
							<td class="px-6 py-4 table-cell-fit">{transaction.id} </td>
							<td class="px-6 py-4">{transaction.ref}</td>
							<td class="px-6 py-4 whitespace-nowrap">{formatDateReadable(transaction.date)}</td>
							<td class="px-6 py-4 table-cell-fit text-right">{transaction.amount} kr </td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
{/await}
