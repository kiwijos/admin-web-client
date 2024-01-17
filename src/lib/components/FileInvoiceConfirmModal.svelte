<script lang="ts">
	import type { SvelteComponent } from 'svelte';
	import { getModalStore } from '@skeletonlabs/skeleton';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';

	let errorMessage = '';

	/**
	 * Makes parent props available to this component.
	 */
	export let parent: SvelteComponent;

	const modalStore = getModalStore();

	const handleSubmit = () => {
		// @ts-expect-error - We wholeheartedly accept this untyped variable too
		return async ({ result }) => {
			if (!result?.data?.success) {
				errorMessage = result?.data?.message ?? 'Något gick fel. Försök igen senare.';
				return;
			}

			invalidate('server:fetchUsers');

			if ($modalStore[0].response) $modalStore[0].response(result.data.invoiceData); // Pass the response data to the calling component

			modalStore.close(); // Close the modal
		};
	};

	// Base Classes
	const cBase = 'card p-4 w-modal shadow-xl space-y-4';
	const cHeader = 'text-2xl font-bold';
</script>

{#if $modalStore[0]}
	<div class={cBase}>
		<header class={cHeader}>{$modalStore[0].title ?? '(title missing)'}</header>
		<article>{$modalStore[0].body ?? '(body missing)'}</article>
		<p class="text-error-500 text-sm">&nbsp;{errorMessage}</p>
		<footer class={parent.regionFooter}>
			<button class="btn {parent.buttonNeutral}" on:click={() => modalStore.close()}
				>{parent.buttonTextCancel}</button
			>
			<form action="/admin/users?/fileInvoice" method="POST" use:enhance={handleSubmit}>
				<button class="btn {parent.buttonPositive}" type="submit" disabled={errorMessage !== ''}
					>Fakturera</button
				>
			</form>
		</footer>
	</div>
{/if}
