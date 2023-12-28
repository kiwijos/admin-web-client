<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

{#await data.transactions}
	<div class="w-full h-full flex items-center justify-center placeholder animate-pulse">
		Hämtar betalningar...
	</div>
{:then transactions}
	{#if transactions.length === 0}
		<div class="w-full h-full flex items-center justify-center">Inga betalningar hittades.</div>
	{:else}
		<div class="relative overflow-x-auto">
			<table class="w-full text-md text-left text-surface-400 dark:text-surface-300">
				<thead
					class="text-xs text-surface-700 uppercase bg-gray-50 dark:text-surface-300 dark:bg-surface-600"
				>
					<tr>
						<th class="px-6 py-3 table-cell-fit">ID</th>
						<th class="px-6 py-3 table-cell-fit">Användare</th>
						<th class="px-6 py-3">Kort</th>
						<th class="px-6 py-3">Summa</th>
						<th class="px-6 py-3">
							<span class="sr-only">Action</span>
						</th>
					</tr>
				</thead>
				<tbody class="overflow-y-scroll text-sm">
					{#each transactions as transaction, i}
						<tr
							class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800"
						>
							<td class="px-6 py-4 table-cell-fit">{transaction.id}</td>
							<td class="px-6 py-4 table-cell-fit"
								><a
									href="/admin/users/{transaction.user_id}"
									class="font-medium text-secondary-500 hover:underline">{transaction.user_id}</a
								></td
							>
							<td class="px-6 py-4">{transaction.ref}</td>
							<td class="px-6 py-4 table-cell-fit text-right">{transaction.amount} kr </td>
							<td class="px-6 py-4 text-right">
								<a href="#" class="font-medium text-secondary-500 hover:underline">Action</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
{:catch error}
	<p>Fel vid hämtning av betalningar: {error.message}</p>
{/await}
