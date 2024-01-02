<script>
	import { page } from '$app/stores';
</script>

<h1>{$page.status}: {$page?.error?.message ? $page.error.message : ''}</h1>
