<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { focusTrap } from '@skeletonlabs/skeleton';

	export let form: ActionData;

	let isFocused: boolean = true;
</script>

<div class="flex flex-col justify-center max-w-sm h-full variant-glass-surface p-4 space-y-8">
	<h2 class="h2 font-thin">Log in to your admin account</h2>
	<p class="font-bold">Don't have an account? <a href="/" class="anchor">Request admin access</a></p>

	<form use:focusTrap={isFocused} action="?/login" method="POST" use:enhance class="flex flex-col space-y-8">
		<label class="label">
			<span>Email</span>
			<input class="input" title="Input (email)" type="email" placeholder="example@email.com" name="email" />
		</label>
		<label class="label">
			<span>Password</span>
			<input
				class="input"
				title="Input (password)"
				type="password"
				placeholder="password"
				name="password"
			/>
		</label>
		<button class="btn variant-filled-primary" type="submit">Sign In</button>
		{#if form?.invalid}
			<p class="text-error-400">Both email and password are required.</p>
		{:else}
			<p>&nbsp;</p>
		{/if}
	</form>
</div>