<script lang="ts">
	import type { PageData } from './$types';
	import type { PaginationSettings } from '@skeletonlabs/skeleton';
	import type { User } from '$lib/types/User';

	import { Paginator } from '@skeletonlabs/skeleton';

	import Fa from 'svelte-fa';
	import { faSearch, faFileInvoice } from '@fortawesome/free-solid-svg-icons';

	import { getModalStore } from '@skeletonlabs/skeleton';
	import type { ModalSettings } from '@skeletonlabs/skeleton';

	import type { InvoiceData } from '$lib/types/InvoiceData';

	export let data: PageData;

	$: numUsersToInvoice = data?.users.filter((user: User) => user.balance < 0).length;

	let modalStore = getModalStore();

	const infoModal: ModalSettings = {
		title: 'Fakturering genomförd',
		body: 'Alla användare med ett negativt saldo har fakturerats.', // Fallback – This will be overwritten
		type: 'alert'
	};

	const showInfoModal = (invoice: InvoiceData) => {
		const infoBody = invoice.invoice_users
			? `${invoice.invoice_users} användare fakturerade för totalt ${invoice.invoiced_amount} kr.`
				? `${invoice.invoiced_users} användare fakturerade för totalt ${invoice.invoiced_amount} kr.`
		infoModal.body = infoBody;

		// Set a timeout to show the modal after the previous modal has closed
		setTimeout(() => {
			modalStore.trigger(infoModal);
		}, 500);
	};

	const confirmModal: ModalSettings = {
		title: 'Bekräfta fakturering',
		body: 'Alla användare som har ett negativt saldo kommer att faktureras.', // Fallback – This will be overwritten
		type: 'component',
		component: 'modalFileInvoiceConfirm',
		response: showInfoModal
	};

	const showFileInvoiceModal = () => {
		confirmModal.body = `Alla användare som har ett negativt saldo kommer att faktureras. Det är just nu ${
			numUsersToInvoice ?? 0
		} användare.`;
		modalStore.trigger(confirmModal);
	};

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
	<div class="grow flex gap-4">
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
		<div class="relative inline-block">
			{#if numUsersToInvoice > 0}
				<span
					class="badge variant-filled-primary dark:variant-soft-primary absolute -top-2 -right-3 z-10"
					>{numUsersToInvoice}</span
				>
			{/if}
			<button
				class="btn text-sm bg-white dark:bg-surface-600"
				title="Öppna en dialogruta för att bekräfta fakturering"
				disabled={numUsersToInvoice === 0}
				on:click={showFileInvoiceModal}
			>
				<span><Fa icon={faFileInvoice} /></span><span>Fakturera</span>
			</button>
		</div>
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
					<th class="px-6 py-3 table-cell-fit"><span class="sr-only">Status</span></th>
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
						<td colspan="7" class="px-6 py-4 text-center">Inga användare hittades.</td>
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
							<td class="table-cell-fit">
								<span
									class="inline-flex p-2 w-6 h-6 items-center justify-center text-xs font-semibold rounded-full {user.active
										? 'bg-green-100 dark:bg-surface-500 text-green-800 dark:text-green-300'
										: 'bg-red-100 dark:bg-surface-500 text-red-800 dark:text-red-300'}"
									>{user.active ? '✓' : '✕'}</span
								>
							</td>
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
							<td class="px-6 w-56 whitespace-nowrap text-right"
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
