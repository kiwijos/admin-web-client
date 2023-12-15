<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { focusTrap } from '@skeletonlabs/skeleton';
	import { brand } from '$lib/config';
	import heroImg from '$lib/assets/img/hero.jpg';

	export let form: ActionData;

	let isFocused: boolean = true;
</script>

<div class="block landscape:md:flex h-full bg-white dark:bg-transparent">
	<div
		class="mx-auto landscape:md:mx-0 shrink-0 flex flex-col justify-center w-max h-full p-4 lg:p-8 space-y-8"
	>
		<div class="">
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
				<span class="text-sm font-bold">Din mail</span>
				<input
					class="input bg-surface-50 dark:bg-surface-700"
					title="Input (mail)"
					type="email"
					placeholder="exempel@email.com"
					name="email"
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
			{#if form?.invalid}
				<p class="text-error-400">Both email and password are required.</p>
			{:else}
				<p>&nbsp;</p>
			{/if}
		</form>
	</div>
	<div class="w-0 grow relative">
		<img
			src={heroImg}
			alt="Grupp med männsiskor som skrattar vid datorn"
			class="absolute inset-0 object-cover h-full w-full"
		/>
		<p
			class="absolute mr-2 mb-2 right-0 bottom-0 text-sm variant-glass-tertiary rounded-3xl px-2 py-1 text-surface-700 dark:text-surface-400"
		>
			Photo by <a
				class="anchor"
				href="https://unsplash.com/@priscilladupreez?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
				>Priscilla Du Preez 🇨🇦</a
			>
			on
			<a
				class="anchor"
				href="https://unsplash.com/photos/three-men-laughing-while-looking-in-the-laptop-inside-room-XkKCui44iM0?utm_content=creditCopyText&utm_medium=referral&utm_source=unsplash"
				>Unsplash</a
			>
		</p>
	</div>
</div>
