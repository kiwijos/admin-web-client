<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
</script>

<div class="p-16 space-y-4 max-w-xl">
	<div>
		<h1 class="text-4xl font-bold">Namn</h1>
		<p class="text-lg text-surface-400">{$page.data.user.email}</p>
	</div>
	<hr />
	<form class="space-y-4">
		<label class="label">
			<span>Din mail</span>
			<input
				class="input"
				title="Input (email)"
				type="email"
				placeholder={$page.data.user.email}
				name="email"
				disabled
			/>
		</label>
		<a href="/" class="block anchor">Ändra mail</a>
		<label class="label">
			<span>Ditt lösenord</span>
			<input
				class="input"
				title="Input (lösenord)"
				type="password"
				placeholder="*********"
				name="password"
				disabled
			/>
		</label>
		<a href="/" class="block anchor">Ändra lösenord</a>
	</form>
	<form action="/logout" method="POST" use:enhance>
		<button type="submit" class="btn variant-filled">Logga ut</button>
	</form>
</div>
