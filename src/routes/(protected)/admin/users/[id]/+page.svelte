<script lang="ts">
	import Fa from 'svelte-fa';
	import { applyAction, enhance } from '$app/forms';
	import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
	import type { PageData, ActionData } from './$types';
	import { Avatar } from '@skeletonlabs/skeleton';
	import { calculateTimeDifference, formatDateReadable } from '$lib/services/dateFormatter';

	export let data: PageData;
	export let form: ActionData;

	// @ts-expect-error - untyped variables are fine
	$: user = form?.success ? form.user ?? data.user : data.user;

	// @ts-expect-error - untyped variables are fine
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleUserUpdateStatus = ({ formElement, formData, action, cancel, submitter }) => {
		if (!formData.get('userId') || !action.search) {
			cancel();
			return;
		}

		// @ts-expect-error - We wholeheartedly accept this untyped variable too
		return async ({ result }) => {
			if (!result?.data?.success) return;

			await applyAction(result); // Apply the action, which will update the form state
		};
	};

	$: negative = user.balance < 0;
</script>

<div class="p-4 md:p-8 max-w-4xl space-y-4 md:space-y-8" data-sveltekit-preload-data="false">
	<div class="flex justify-between items-end gap-4">
		<div class="flex gap-4 items-end">
			<div class="relative inline-block">
				<span
					class="absolute -bottom-2 -left-1 z-10 inline-flex p-2 w-8 h-8 items-center justify-center text-xs font-semibold rounded-full {user.active
						? 'bg-green-100 dark:bg-surface-500 text-green-800 dark:text-green-300'
						: 'bg-red-100 dark:bg-surface-500 text-red-800 dark:text-red-300'}"
					>{user.active ? '✓' : '✕'}</span
				>
				<Avatar
					width="w-16"
					background="bg-gray-100 dark:bg-surface-700"
					border="border-2 {user.active
						? 'border-green-300 dark:border-green-600'
						: 'border-red-300 dark:border-red-600'}"
					initials={user.email[0] ?? '?'}
				/>
			</div>

			<div class="max-w-36 sm:max-w-fit">
				<h1 class="text-3xl font-bold">{user.email.split('@')[0]}</h1>
				<p class="text-surface-400 truncate">{user.email}</p>
			</div>
			<form action="/admin/users?/updateStatus" method="POST" use:enhance={handleUserUpdateStatus}>
				<input type="hidden" name="userId" value={user.id} />
				<input type="hidden" name="active" value={!user.active} />
				<button
					type="submit"
					class="btn btn-sm dark:ring-1 dark:ring-surface-600 bg-white dark:bg-surface-800 {user.active
						? 'text-red-700'
						: 'text-green-700'}"
				>
					{user.active ? 'Inaktivera' : 'Aktivera'}
				</button>
			</form>
		</div>
		<div>
			<span
				class="badge !text-lg md:text-xl {negative
					? ' variant-soft-error '
					: 'variant-soft-success'}">{user.balance} kr</span
			>
		</div>
	</div>

	{#await data.trips}
		<div class="rounded-container-token p-4 bg-white dark:bg-surface-800">
			<div class="flex justify-between pb-4 items-center">
				<div class="placeholder animate-pulse w-32" />
				<div class="placeholder animate-pulse w-24" />
			</div>

			<div
				class="p-6 rounded-none w-full placeholder animate-pulse h-64 flex items-center justify-center"
			>
				Hämtar de senaste resorna...
			</div>
		</div>
	{:then trips}
		<div class="rounded-container-token p-4 bg-white dark:bg-surface-800">
			<div class="flex justify-between pb-4 items-center border-b border-gray-100 dark:border-0">
				<h2 class="text-xs font-bold uppercase">Senaste resorna</h2>
				{#if trips.length > 0}
					<a
						href="/admin/users/{trips[0].user_id}/trips"
						class="font-medium text-secondary-500 hover:underline flex gap-1 items-center text-sm"
					>
						<span>Se alla resor</span>
						<Fa icon={faChevronRight} />
					</a>
				{/if}
			</div>
			<div>
				<div class="relative overflow-x-auto">
					<table class="w-full text-md text-left text-surface-400 dark:text-surface-300">
						<thead>
							<tr>
								<th>
									<span class="sr-only">Rese-ID</span>
								</th>
								<th>
									<span class="sr-only">Cykel-ID</span>
								</th>
								<th>
									<span class="sr-only">Startdatum</span>
								</th>
								<th>
									<span class="sr-only">Tid</span>
								</th>
								<th>
									<span class="sr-only">Summa</span>
								</th>
							</tr>
						</thead>
						<tbody class="overflow-y-scroll text-sm" data-sveltekit-preload-data="false">
							{#if trips.length === 0}
								<tr>
									<td colspan="6" class="px-6 py-4 text-center">Inga resor hittades.</td>
								</tr>
							{:else}
								{#each trips as trip}
									<tr
										class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800"
									>
										<td class="px-6 py-4 w-24">{trip.id}</td>
										<td class="px-6 py-4"
											><a
												href="/admin/bikes/{trip.bike_id}"
												class="font-medium text-secondary-500 hover:underline whitespace-nowrap"
												>Cykel {trip.bike_id}</a
											>
										</td>
										<td class="px-6 py-4 text-right whitespace-nowrap">
											{formatDateReadable(trip.start_time)}
										</td>
										<td class="px-6 py-4 text-right whitespace-nowrap">
											{calculateTimeDifference(
												trip.start_time,
												trip.end_time ?? String(new Date())
											)}
										</td>
										<td class="px-6 py-4 text-right whitespace-nowrap">
											{trip.total_cost ? `${trip.total_cost.toFixed(2)} kr` : '(ej avslutad)'}
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{:catch error}
		<div class="w-full h-full flex items-center justify-center">
			Fel vid hämtning av resor: {error.message}
		</div>
	{/await}
	{#await data.transactions}
		<div class="rounded-container-token p-4 bg-white dark:bg-surface-800">
			<div class="flex justify-between pb-4 items-center">
				<div class="placeholder animate-pulse w-36" />
				<div class="placeholder animate-pulse w-28" />
			</div>

			<div
				class="p-6 rounded-none w-full placeholder animate-pulse h-64 flex items-center justify-center"
			>
				Hämtar de senaste betalningarna...
			</div>
		</div>
	{:then transactions}
		<div class="rounded-container-token p-4 bg-white dark:bg-surface-800">
			<div class="flex justify-between pb-4 items-center border-b border-gray-100 dark:border-0">
				<h2 class="text-xs font-bold uppercase">Senaste betalningarna</h2>
				{#if transactions.length > 0}
					<a
						href="/admin/users/{transactions[0].user_id}/transactions"
						class="font-medium text-secondary-500 hover:underline flex gap-1 items-center text-sm"
					>
						<span>Se alla betalningar</span>
						<Fa icon={faChevronRight} />
					</a>
				{/if}
			</div>
			<div>
				<div class="relative overflow-x-auto">
					<table class="w-full text-md text-left text-surface-400 dark:text-surface-300">
						<thead>
							<tr>
								<th>
									<span class="sr-only">Betalnings-ID</span>
								</th>
								<th>
									<span class="sr-only">Betaldatum</span>
								</th>
								<th>
									<span class="sr-only">Kort</span>
								</th>
								<th>
									<span class="sr-only">Summa</span>
								</th>
							</tr>
						</thead>
						<tbody class="overflow-y-scroll text-sm" data-sveltekit-preload-data="false">
							{#if transactions.length === 0}
								<tr>
									<td colspan="6" class="px-6 py-4 text-center">Inga betalningar hittades.</td>
								</tr>
							{:else}
								{#each transactions as transaction}
									<tr
										class="odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800"
									>
										<td class="px-6 py-4 w-24">{transaction.id}</td>
										<td class="px-6 py-4 whitespace-nowrap">
											{transaction.ref}
										</td>
										<td class="px-6 py-4 text-right whitespace-nowrap">
											{formatDateReadable(transaction.date)}
										</td>
										<td class="px-6 py-4 text-right whitespace-nowrap">
											{transaction.amount} kr
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{:catch error}
		<div class="w-full h-full flex items-center justify-center">
			Fel vid hämtning av betalningar: {error.message}
		</div>
	{/await}
</div>
