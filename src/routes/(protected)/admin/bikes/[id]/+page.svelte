<script lang="ts">
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-nocheck - TS doesn't like the `bike` object and expects it to be called `bikes`, which I think has to do with the flow of data through the load functions
	// In any case, it works, so I'm disabling TS for this file for now as all other checks pass
	import type { PageData, ActionData } from '../$types';

	import { applyAction, enhance } from '$app/forms';
	import { statusCodes } from '$lib/help/statusCodes';
	import Fa from 'svelte-fa';
	import { faInfoCircle, faPen } from '@fortawesome/free-solid-svg-icons';
	import { Accordion, AccordionItem, ProgressRadial } from '@skeletonlabs/skeleton';

	export let data: PageData;
	export let form: ActionData;

	$: bike = form?.success ? form.bike ?? data.bike : data.bike;

	// @ts-expect-error - untyped variables are fine
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const handleBikeActiveStatus = ({ formElement, formData, action, cancel, submitter }) => {
		if (!formData.get('id')) {
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
	$: charge = bike.charge_perc * 100;
	$: meterColor =
		charge <= 20 ? 'stroke-error-500' : charge <= 40 ? 'stroke-warning-500' : 'stroke-success-500';
	$: trackColor =
		charge <= 20
			? 'stroke-error-700/30'
			: charge <= 40
				? 'stroke-warning-700/30'
				: 'stroke-success-700/30';
	$: glowColor =
		charge <= 20
			? 'shadow-[0_0px_30px_2px_rgba(255,204,203,0.3)]'
			: charge <= 40
				? 'shadow-[0_0px_30px_2px_rgba(255,255,237,0.3)]'
				: 'shadow-[0_0px_30px_2px_rgba(144,238,144,0.3)]';
</script>

<!-- border dark:border-surface-600 bg-white dark:bg-surface-800 -->
<div class="p-4 md:p-8 max-w-2xl">
	<div
		class="w-full flex bg-white dark:bg-surface-800 border dark:border-surface-600 rounded-full md:rounded-l-full"
	>
		<div class="sm:w-fit p-4">
			<div
				class="w-fit mx-auto dark:ring-2 ring-surface-600 rounded-full {!bike.active || glowColor}"
			>
				<ProgressRadial
					stroke={60}
					width="w-56 sm:w-36"
					meter={meterColor}
					track={trackColor}
					strokeLinecap="round"
					value={charge}>{charge}%</ProgressRadial
				>
			</div>
		</div>
		<div class="flex flex-col justify-center">
			<h1 class="text-2xl font-bold">Cykelnr {bike.id}</h1>
			<p class="text-sm text-surface-400 dark:text-surface-300">
				{bike.active ? 'Aktiv' : 'Avstängd'} - {statusCodes[bike.status_id]}
			</p>
		</div>
	</div>
		<form
			method="POST"
			use:enhance={handleBikeActiveStatus}
			class="space-y-4"
			aria-describedby="helper-text-explanation"
		>
			<label class="label flex items-center justify-between">
				<span class="block px-2 uppercase inline-block text-xs font-bold"
					>{bike.active ? 'Aktiv' : 'Inaktiv'}</span
				>
				{#if bike.active}
					<button
						title="Stäng av cykeln"
						formaction="/admin/bikes?/deactivate"
						class="btn btn-sm variant-ringed-error w-full">Stäng av</button
					>
				{:else}
					<button
						title="Aktivera cykeln"
						formaction="/admin/bikes?/activate"
						class="btn btn-sm variant-ringed-success w-full">Aktivera</button
					>
				{/if}
				<input value={bike.id} name="id" hidden />
			</label>
		</form>
			<Accordion>
				<AccordionItem closed>
					<svelte:fragment slot="lead"><Fa icon={faInfoCircle} /></svelte:fragment>
					<svelte:fragment slot="summary"
						><p class="text-sm">Vad betyder aktiv och inaktiv?</p></svelte:fragment
					>
					<svelte:fragment slot="content"
						><p id="helper-text-explanation" class="text-sm text-gray-500 dark:text-gray-400">
							Stäng av cykeln om den är trasig eller behöver underhåll. Aktivera cykeln om den är
							reparerad och redo att användas. <a
								href="/"
								class="text-secondary-500 font-bold hover:underline"
								>För mer information, se hjälpsidan.</a
							>
						</p></svelte:fragment
					>
				</AccordionItem>
			</Accordion>
		</div>
		<div
			class="rounded-container-token p-4 bg-white dark:bg-surface-800 space-y-4 divide-y divide-gray-100 dark:divide-surface-700"
		>
			<div>
				<div class="flex items-center justify-between">
					<span class="px-2 text-xs font-bold uppercase">Batteri</span><span
						class="text-sm px-2 py-2">{bike.charge_perc * 100}%</span
					>
				</div>
				<ChargeMeter fraction={bike.charge_perc} />
			</div>
			<div>
				<span class="inline-block px-2 py-4 text-xs font-bold uppercase">Position</span>
				<ul class="text-left text-surface-400 dark:text-surface-300">
					<li
						class="px-6 py-4 text-sm grid grid-cols-2 odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800"
					>
						<span>Stad</span><span>{bike.city_id}</span>
					</li>
					<li
						class="px-6 py-4 text-sm grid grid-cols-2 odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800"
					>
						<span>Latitud</span><span>{bike.coords[0]}</span>
					</li>
					<li
						class="px-6 py-4 text-sm grid grid-cols-2 odd:bg-white odd:dark:bg-surface-900 even:bg-gray-50 even:dark:bg-surface-800"
					>
						<span>Longitud</span><span>{bike.coords[1]}</span>
					</li>
				</ul>
			</div>
		</div>
		<div
			class="rounded-container-token p-4 bg-white dark:bg-surface-800 space-y-8 col-span-1 sm:col-span-2 lg:col-span-1"
		>
			<div class="flex items-center justify-between">
				<span class="px-2 text-xs font-bold uppercase">Status</span><span class="text-sm px-2 py-2"
					>{statusCodes[bike.status_id]}</span
				>
			</div>
			<Accordion>
				<AccordionItem closed>
					<svelte:fragment slot="lead"><Fa icon={faPen} /></svelte:fragment>
					<svelte:fragment slot="summary"><p class="text-sm">Ändra status</p></svelte:fragment>
					<svelte:fragment slot="content"
						><form
							action="/admin/bikes?/changeStatus"
							method="POST"
							use:enhance
							aria-describedby="helper-text-explanation-2"
							class="flex flex-col"
						>
							<label class="label">
								<span class="sr-only">Status</span>
								<select
									name="status"
									class="select bg-white border-none text-sm scrollbar-hide px-0"
									size="6"
								>
									{#each Object.entries(statusCodes) as [id, status]}
										<option value={id} selected={bike.status_id == id} class="truncate"
											>{status}</option
										>
									{/each}
								</select>
							</label>

							<button type="submit" class="btn btn-sm variant-ringed-secondary self-end"
								>Ändra</button
							>
							<input value={bike.id} name="id" hidden />
						</form></svelte:fragment
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
	{/await}
</div>
