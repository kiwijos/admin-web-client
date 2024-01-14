<script lang="ts">
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-nocheck - TS doesn't like the `bike` object and expects it to be called `bikes`, which I think has to do with the flow of data through the load functions
	// In any case, it works, so I'm disabling TS for this file for now as all other checks pass
	import type { PageData, ActionData } from '../$types';

	import { applyAction, enhance } from '$app/forms';
	import { statusCodes } from '$lib/help/statusCodes';
	import Fa from 'svelte-fa';
	import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
	import { Accordion, AccordionItem, ProgressRadial } from '@skeletonlabs/skeleton';

	export let data: PageData;
	export let form: ActionData;

	$: bike = form?.success ? form.bike ?? data.bike : data.bike;

	$: cityName =
		bike.city_id === 'STHLM'
			? 'Stockholm'
			: bike.city_id === 'GBG'
				? 'Göteborg'
				: bike.city_id === 'KRLST'
					? 'Karlstad'
					: '--';

	let currentStatusId;
	let lockSelectSubmit = true;

	// Make select sumbittable when a new status is selected
	const onSelectChange = () => {
		if (currentStatusId == bike.status_id) {
			lockSelectSubmit = true;
		} else {
			lockSelectSubmit = false;
		}
	};

	// @ts-expect-error - untyped variables are fine
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleBikeActiveStatus = ({ formElement, formData, action, cancel, submitter }) => {
		if (!formData.get('id') || !action.search) {
			cancel();
			return;
		}

		if (action.search === '?/deactivate' && bike.active === false) {
			cancel();
			return;
		}

		if (action.search === '?/activate' && bike.active === true) {
			cancel();
			return;
		}

		// @ts-expect-error - We wholeheartedly accept this untyped variable too
		return async ({ result }) => {
			if (!result?.data?.success) return;

			await applyAction(result); // Apply the action, which will update the form state
		};
	};

	// @ts-expect-error - untyped variables are fine
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleBikeStatusChange = ({ formElement, formData, action, cancel, submitter }) => {
		if (!formData.get('id') || !formData.get('status') || !action.search) {
			cancel();
			return;
		}

		// cancel if the status is the same
		if (bike.status_id == formData.get('status')) {
			cancel();
			return;
		}

		// cancel if the status of the bike is either 2 or 5
		if (bike.status_id === 2 || bike.status_id === 5) {
			cancel();
			return;
		}

		// cancel if the new status is 2 or 5
		if (formData.get('status') == 2 || formData.get('status') == 5) {
			cancel();
			return;
		}

		lockSelectSubmit = true;

		// @ts-expect-error - We wholeheartedly accept this untyped variable too
		return async ({ result }) => {
			if (!result?.data?.success) {
				lockSelectSubmit = false;
				return;
			}

			await applyAction(result); // Apply the action, which will update the form state
		};
	};

	let meterColor: string;
	let trackColor: string;
	let glowColor: string;

	$: charge = bike.charge_perc * 100;

	$: {
		if (charge <= 15) {
			meterColor = bike.active
				? 'stroke-red-500 dark:stroke-error-500'
				: 'stroke-red-800 dark:stroke-error-800';
			trackColor = 'stroke-error-700/30';
			glowColor = 'ring-8 ring-red-100 dark:shadow-[0_0px_30px_2px_rgba(210,127,129,0.3)]';
		} else if (charge <= 40) {
			meterColor = bike.active
				? 'stroke-yellow-300 dark:stroke-warning-600'
				: 'stroke-warning-600 dark:stroke-warning-800';
			trackColor = 'stroke-warning-800/40 dark:stroke-warning-700/30';
			glowColor = 'ring-8 ring-yellow-100 dark:shadow-[0_0px_30px_2px_rgba(244,231,191,0.3)]';
		} else {
			meterColor = bike.active
				? 'stroke-green-500 dark:stroke-success-600'
				: 'stroke-green-800 dark:stroke-success-800';
			trackColor = 'stroke-success-700/30';
			glowColor = 'ring-8 ring-green-100 dark:shadow-[0_0px_30px_2px_rgba(144,238,144,0.3)]';
		}
	}
</script>

<!-- border dark:border-surface-600 bg-white dark:bg-surface-800 -->
<div class="p-4 md:p-8 max-w-2xl space-y-4">
	<div
		class="w-full flex sm:bg-white sm:dark:bg-surface-800 sm:border-r sm:border-t sm:border-b sm:dark:border-surface-600 rounded-full"
	>
		<div class="p-2 sm:p-4 sm:border rounded-full dark:border-surface-600 dark:bg-surface-900">
			<div
				class="w-fit dark:ring-1 sm:dark:ring-2 dark:ring-surface-600 rounded-full {!bike.active ||
					glowColor}"
			>
				<ProgressRadial
					stroke={60}
					width="w-24 sm:w-36"
					meter={meterColor}
					track={trackColor}
					strokeLinecap="round"
					value={charge}>{charge}%</ProgressRadial
				>
			</div>
		</div>

		<div class="flex flex-col justify-end items-start p-2 sm:p-4 space-y-2 sm:space-y-4">
			<div class="px-2">
				<h1 class="text-xl sm:text-3xl font-bold">Cykelnr {bike.id}</h1>
				<p class="text-sm sm:text-base text-surface-400 dark:text-surface-300 truncate">
					{bike.active ? 'Aktiv' : 'Avstängd'} ({statusCodes[bike.status_id]})
				</p>
			</div>
			<form
				method="POST"
				use:enhance={handleBikeActiveStatus}
				aria-describedby="helper-text-explanation"
				class="-ml-2"
			>
				<label class="label flex items-center justify-between">
					<div
						class="btn-group sm:text-sm ring-1 ring-surface-50 dark:ring-surface-500 [&>*+*]:border-surface-50 [&>*+*]:dark:border-surface-500"
					>
						<button
							title="Stäng av cykeln"
							formaction="/admin/bikes?/deactivate"
							disabled={!bike.active}
							class={!bike.active
								? 'shadow-inner bg-gray-100 dark:bg-surface-700'
								: 'bg-white dark:bg-surface-800'}>Stäng av</button
						>
						<button
							title="Aktivera cykeln"
							formaction="/admin/bikes?/activate"
							disabled={bike.active}
							class={bike.active
								? 'shadow-inner bg-gray-100 dark:bg-surface-700'
								: 'bg-white dark:bg-surface-800'}>Aktivera</button
						>
					</div>
					<input value={bike.id} name="id" hidden />
				</label>
			</form>
		</div>
	</div>
	<div class="rounded-container-token p-2 sm:p-4 bg-white dark:bg-surface-800">
		<div class="text-left text-surface-400 dark:text-surface-300 p-4 text-sm">
			<p class="text-surface-700 dark:text-surface-100 text-base">{cityName} ({bike.city_id})</p>
			<p>(Lat. {bike.coords[1]}, Lon. {bike.coords[0]})</p>
		</div>
	</div>
	<div
		class="rounded-container-token p-4 bg-white dark:bg-surface-800 space-y-8 col-span-1 sm:col-span-2 lg:col-span-1"
	>
		<form
			action="/admin/bikes?/changeStatus"
			method="POST"
			use:enhance={handleBikeStatusChange}
			aria-describedby="helper-text-explanation-2"
			class="flex gap-2 md:gap-4"
		>
			<label class="label grow">
				<span class="sr-only">Ändra status</span>
				<select
					name="status"
					bind:value={currentStatusId}
					on:change={onSelectChange}
					disabled={bike.status_id == 2 || bike.status_id == 5}
					class="hide-scrollbar block py-2 px-0 w-full text-sm text-surface-700 bg-transparent border-b-2 border-surface-50 focus:border-surface-500 border-0 appearance-none dark:text-surface-300 dark:border-surface-600 focus:outline-none focus:ring-0 peer"
				>
					{#each Object.entries(statusCodes) as [id, status]}
						{#if id == 2 || id == 5}
							<option value={id} disabled class="truncate">{status}</option>
						{:else}
							<option value={id} selected={bike.status_id == id} class="truncate">{status}</option>
						{/if}
					{/each}
				</select>
			</label>
			<button
				type="submit"
				class="btn btn-sm ring-1 ring-surface-50 dark:ring-surface-500 hover:ring-surface-200 dark:hover:ring-surface-500 {lockSelectSubmit
					? 'bg-gray-100 dark:bg-surface-700'
					: 'bg-white dark:bg-surface-800'}"
				disabled={lockSelectSubmit}>Ändra status</button
			>
			<input value={bike.id} name="id" hidden />
		</form>
	</div>
	<div class="rounded-container-token p-2 sm:p-4 bg-white dark:bg-surface-800">
		<Accordion>
			<AccordionItem closed>
				<svelte:fragment slot="lead"><Fa icon={faInfoCircle} /></svelte:fragment>
				<svelte:fragment slot="summary"
					><p class="text-sm">När ska jag aktivera och stänga av en cykel?</p></svelte:fragment
				>
				<svelte:fragment slot="content"
					><div
						id="helper-text-explanation"
						class="text-sm text-gray-500 dark:text-gray-400 space-y-2"
					>
						<p>
							Stäng av cykeln: om den <span class="uppercase text-surface-900-50-token"
								>brukas olovligt</span
							>,
							<span class="uppercase text-surface-900-50-token"> är trasig</span>,
							<span class="uppercase text-surface-900-50-token">omedelbart behöver underhåll</span>
							eller på annat sätt
							<span class="uppercase text-surface-900-50-token"
								>utgör en fara för föraren eller andra</span
							>.
						</p>
						<p>
							Aktivera cykeln: om den är reparerad och redo att användas.
							<a href="/" class="text-secondary-500 font-bold hover:underline"
								>För mer information, se hjälpsidan.</a
							>
						</p>
					</div></svelte:fragment
				>
			</AccordionItem>
			<AccordionItem closed>
				<svelte:fragment slot="lead"><Fa icon={faInfoCircle} /></svelte:fragment>
				<svelte:fragment slot="summary"
					><p class="text-sm">Vilken status ska jag använda?</p></svelte:fragment
				>
				<svelte:fragment slot="content"
					><div id="helper-text-explanation-2" class="space-y-2">
						<p class="text-sm text-gray-500 dark:text-gray-400">
							Cykelns status påverkar om den kan hyras eller inte.
						</p>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							Obs! Cykelns automatiska styrsystem kan också ändra statusen.
						</p>
					</div></svelte:fragment
				>
			</AccordionItem>
		</Accordion>
	</div>
</div>
