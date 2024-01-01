<script lang="ts">
	import type { PageData } from '../$types';
	import ChargeMeter from '$lib/components/ChargeMeter.svelte';
	import { enhance } from '$app/forms';
	import { statusCodes } from '$lib/help/statusCodes';
	import Fa from 'svelte-fa';
	import { faInfoCircle, faPen } from '@fortawesome/free-solid-svg-icons';
	import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';

	export let data: PageData;
</script>

<div class="p-4 md:p-8 max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
	{#await data.bike}
		<div class="col-span-3 text-center">Hämtar cykel...</div>
	{:then bike}
		<div class="rounded-container-token p-4 bg-white dark:bg-surface-800 space-y-8">
			<form method="POST" use:enhance class="space-y-4" aria-describedby="helper-text-explanation">
				<label class="label flex items-center justify-between">
					<span class="block px-2 uppercase inline-block text-xs font-bold"
						>{bike.active ? 'Aktiv' : 'Inaktiv'}</span
					>
					<div class="flex gap-1 items-center shrink">
						{#if bike.active}
							<button
								title="Den här cykeln är redan aktiv"
								type="button"
								disabled
								class="btn btn-sm">Aktivera</button
							>
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
							><button
								title="Den här cykeln är redan avstängd"
								type="button"
								class="btn btn-sm"
								disabled>Stäng av</button
							>
						{/if}
					</div>
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
