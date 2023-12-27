<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { focusTrap } from '@skeletonlabs/skeleton';
	import { brand } from '$lib/config';

	export let form: ActionData;

	let isFocused: boolean = true;

	let errorMessage = '';

	$: {
		if (form?.invalid || form?.error) {
			errorMessage = form?.message ?? 'Nått gick fel. Försök igen senare.';
		}
	}
</script>

<div
	class="flex flex-col justify-center md:max-w-sm max-w-full h-full bg-surface-100 dark:bg-surface-800 p-4 space-y-8"
>
	<div>
		<h1 class="text-4xl font-thin">Logga in i adminportalen</h1>
		<p class="text-sm text-right text-surface-700 dark:text-surface-400">
			Powered by <a href="/" class="anchor font-extrabold">{brand}</a>
		</p>
	</div>
	<form
		use:focusTrap={isFocused}
		action="?/login"
		method="POST"
		use:enhance
		class="flex flex-col space-y-8"
	>
		<label class="label">
			<span class="text-sm font-bold">Ditt användarnamn</span>
			<input
				class="input bg-surface-50 dark:bg-surface-700"
				title="Input (användarnamn)"
				placeholder="användarnamn"
				name="username"
			/>
		</label>
		<label class="label">
			<span class="text-sm font-bold">Ditt lösenord</span>
			<input
				class="input bg-surface-50 dark:bg-surface-700"
				title="Input (lösenord)"
				type="password"
				placeholder="Lösenord"
				name="password"
			/>
		</label>
		<button class="btn variant-filled-primary" type="submit">Logga in</button>

		<p class="text-error-500 text-sm">&nbsp;{errorMessage}</p>
	</form>
</div>
