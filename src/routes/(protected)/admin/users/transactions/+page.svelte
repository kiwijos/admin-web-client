<script lang="ts">
	import type { PageData } from './$types';
	import type { PaginationSettings } from '@skeletonlabs/skeleton';
	import type { Transaction } from '$lib/types/Transaction';

	import { Paginator } from '@skeletonlabs/skeleton';
	import { formatDateReadable } from '$lib/services/dateFormatter';

	export let data: PageData;

	let fromDate: Date | undefined;
	let toDate: Date | undefined;

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
	$: filteredBody = data?.transactions.filter((transaction: Transaction) => {
		if (fromDate && toDate) {
			return new Date(transaction.date) >= fromDate && new Date(transaction.date) <= toDate;
		} else if (fromDate) {
			return new Date(transaction.date) >= fromDate;
		} else if (toDate) {
			return new Date(transaction.date) <= toDate;
		} else {
			return true;
		}
	});

	// Slice the data to fit the pagination
	let sourceBodySliced: Transaction[];
	$: sourceBodySliced = filteredBody.slice(
		paginationSettings.page * paginationSettings.limit,
		paginationSettings.page * paginationSettings.limit + paginationSettings.limit
	);

	let size: number;
	$: size = data?.transactions.length;

	// Same goes for the pagination settings
	let paginationSettings: PaginationSettings;
	$: paginationSettings = {
		page: 0,
		limit: 50,
		size: size,
		amounts: [5, 10, 50, 100, 500, 1000]
	};
</script>

{#await data.transactions}
	<div class="w-full h-full flex items-center justify-center placeholder animate-pulse">
		Hämtar betalningar...
	</div>
{:then transactions}
	<div class="bg-surface-50 dark:bg-transparent flex flex-col xl:flex-row gap-4 p-8">
		<div class="flex flex-col sm:flex-row gap-4 grow">
			<div class="input-group grid-cols-[auto_1fr_auto] border-none">
				<div class="input-group-shim bg-white dark:bg-surface-600 text-sm">Från</div>
				<input
					type="date"
					class="text-sm !bg-white dark:!bg-surface-700 focus:!ring-blue-500 dark:placeholder-surface-400 dark:text-white dark:focus:ring-blue-500"
					on:input={inputFromDate}
				/>
			</div>
			<div class="input-group grid-cols-[auto_1fr_auto] border-none">
				<div class="input-group-shim bg-white dark:bg-surface-600 text-sm">Till</div>
				<input
					type="date"
					class="text-sm !bg-white dark:!bg-surface-700 focus:!ring-blue-500 dark:placeholder-surface-400 dark:text-white dark:focus:ring-blue-500"
					on:input={inputToDate}
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
				justify="justify-normal"
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
					<th class="px-6 py-3 table-cell-fit"><span class="sr-only">ID</span></th>
					<th class="px-6 py-3 table-cell-fit">Användare</th>
					<th class="px-6 py-3">Kort</th>
					<th class="px-6 py-3">Datum</th>
					<th class="px-6 py-3 table-cell-fit">Summa</th>
				</tr>
			</thead>
			<tbody class="overflow-y-scroll text-sm" data-sveltekit-preload-data="false">
				{#if sourceBodySliced.length === 0}
					<tr>
						<td colspan="5" class="px-6 py-4 text-center">Inga betalningar hittades.</td>
					</tr>
				{:else}
					{#each sourceBodySliced as transaction, i}
						<tr
							class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800"
						>
							<td class="px-6 py-4 table-cell-fit">{transaction.id} </td>
							<td class="px-6 py-4 table-cell-fit"
								><a
									href="/admin/users/{transaction.user_id}"
									class="font-medium text-secondary-500 hover:underline">{transaction.user_id}</a
								></td
							>
							<td class="px-6 py-4">{transaction.ref}</td>
							<td class="px-6 py-4 whitespace-nowrap">{formatDateReadable(transaction.date)}</td>
							<td class="px-6 py-4 table-cell-fit text-right">{transaction.amount} kr </td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
{:catch error}
	<div class="w-full h-full flex items-center justify-center">
		Fel vid hämtning av betalningar: {error.message}
	</div>
{/await}
