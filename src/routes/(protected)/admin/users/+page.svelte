<script lang="ts">
	import type { PageData } from './$types';
	import { Paginator } from '@skeletonlabs/skeleton';
	import type { PaginationSettings } from '@skeletonlabs/skeleton';
	import Fa from 'svelte-fa';
	import { faSearch } from '@fortawesome/free-solid-svg-icons';

	export let data: PageData;

	$: size = data?.props.users.length;

	// Same goes for the pagination settings
	let paginationSettings: PaginationSettings;
	$: paginationSettings = {
		page: 0,
		limit: 10,
		size: size,
		amounts: [5, 10, 50]
	};

	// Slice the data to fit the pagination
	$: sourceBodySliced = data?.props.users.slice(
		paginationSettings.page * paginationSettings.limit,
		paginationSettings.page * paginationSettings.limit + paginationSettings.limit
	);
</script>

<div class="bg-surface-50 dark:bg-transparent flex gap-4 p-8">
	<div class="input-group grid-cols-[auto_1fr_auto] border-none">
		<div class="input-group-shim bg-white dark:bg-surface-600">
			<Fa size="sm" icon={faSearch} />
		</div>
		<input
			type="search"
			class="text-sm !bg-white dark:!bg-surface-700 focus:!ring-blue-500 dark:placeholder-surface-400 dark:text-white dark:focus:ring-blue-500"
			placeholder="Sök efter användare"
		/>
	</div>
	<Paginator
		bind:settings={paginationSettings}
		showFirstLastButtons={true}
		showPreviousNextButtons={true}
		amountText="per sida"
		separatorText="av"
		select="hover:cursor-pointer text-sm dark:bg-surface-600 rounded-3xl border-transparent"
		controlVariant="text-sm bg-white dark:bg-surface-600 border-transparent"
	/>
</div>
<div class="relative overflow-x-auto">
	<table class="w-full text-md text-left text-surface-400 dark:text-surface-300">
		<thead
			class="text-xs text-surface-700 uppercase bg-gray-50 dark:text-surface-300 dark:bg-surface-600"
		>
			<tr>
				<th class="px-6 py-3 table-cell-fit">ID</th>
				<th class="px-6 py-3">Mail</th>
				<th class="px-6 py-3">Kortnummer</th>
				<th class="px-6 py-3">Kort</th>
				<th class="px-6 py-3 table-cell-fit">Saldo</th>
				<th class="px-6 py-3">
					<span class="sr-only">Ändra</span>
				</th>
			</tr>
		</thead>
		<tbody class="overflow-y-scroll text-sm">
			{#each sourceBodySliced as row, i}
				{@const negative = row.balance < 0}
				<tr class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800">
					<td class="px-6 py-4 table-cell-fit">{row.id}</td>
					<td class="px-6 py-4">{row.email}</td>
					<td class="px-6 py-4">{row.card_nr}</td>
					<td class="px-6 py-4">{row.card_type}</td>
					<td class="px-6 py-4 table-cell-fit text-right"
						><span class="badge {negative ? ' variant-soft-error ' : 'variant-soft-success'}"
							>{row.balance} kr</span
						>
					</td>
					<td class="px-6 py-4">
						<a
							href="/admin/users/{row.id}/edit"
							class="font-medium text-secondary-600 dark:text-secondary-500 hover:underline"
							>Ändra</a
						>
					</td></tr
				>
			{/each}
		</tbody>
	</table>
</div>
