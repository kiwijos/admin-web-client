<script lang="ts">
	import { page } from '$app/stores';

	// map route names in english to their swedish counterparts to display in breadcrumbs
	const names: { [key: string]: string } = {
		users: 'Användare',
		transactions: 'Betalningar',
		trips: 'Resor',
		bikes: 'Cyklar'
	};

	// create breadcrumbs for all pages after /admin
	$: myBreadcrumbs = $page.url.pathname
		.split('/')
		.slice(2)
		.map((crumb, i) => {
			return {
				label: names[crumb] || crumb,
				link: $page.url.pathname
					.split('/')
					.slice(0, i + 3)
					.join('/')
			};
		});
</script>

<ol class="breadcrumb">
	{#each myBreadcrumbs as crumb, i}
		{#if i < myBreadcrumbs.length - 1}
			<li class="crumb"><a class="anchor" href={crumb.link}>{crumb.label}</a></li>
			<li class="crumb-separator" aria-hidden>/</li>
		{:else}
			<li class="crumb">{crumb.label}</li>
		{/if}
	{/each}
</ol>
