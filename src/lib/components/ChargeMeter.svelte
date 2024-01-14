<script lang="ts">
	export let fraction: number;
</script>

<meter
	class="charge-meter"
	min="0"
	max="1"
	low="0.15"
	high="0.4"
	optimum="0.8"
	value={fraction}
	aria-valuenow={fraction}
	aria-valuemin="0"
	aria-valuemax="1"
	>at {fraction}/1
</meter>

<style>
	.charge-meter {
		display: inline-block;
		width: 100%;
	}

	.charge-meter::-webkit-meter-bar {
		background: rgba(var(--color-surface-500), 0.5);
	}

	.charge-meter::-webkit-meter-optimum-value {
		background-color: rgb(34 197 94);
	}

	.charge-meter::-webkit-meter-suboptimum-value {
		background-color: rgb(250 204 21);
	}

	.charge-meter::-webkit-meter-even-less-good-value {
		background-color: rgb(239 68 68);
	}

	.charge-meter::-moz-meter-bar {
		background: rgba(var(--color-surface-500), 0.5);
	}

	.charge-meter::-moz-meter-optimum {
		background-color: rgb(34 197 94);
	}

	.charge-meter::-moz-meter-sub-optimum {
		background-color: rgb(250 204 21);
	}

	.charge-meter::-moz-meter-sub-sub-optimum {
		background-color: rgb(239 68 68);
	}

	.charge-meter::-ms-fill {
		background: rgba(var(--color-surface-500), 0.5);
	}

	.charge-meter::-ms-fill-lower {
		background-color: rgb(239 68 68);
	}

	.charge-meter::-ms-fill-upper {
		background-color: rgb(34 197 94);
	}

	/* svelte-ignore */
	:global(html.dark .charge-meter::-webkit-meter-bar) {
		background: rgba(var(--color-surface-500), 0.5);
	}

	:global(html.dark .charge-meter::-webkit-meter-optimum-value) {
		background: rgb(var(--color-success-500));
	}

	:global(html.dark .charge-meter::-webkit-meter-suboptimum-value) {
		background: rgb(var(--color-warning-500));
	}

	:global(html.dark .charge-meter::-webkit-meter-even-less-good-value) {
		background: rgb(var(--color-error-500));
	}

	:global(html.dark .charge-meter::-moz-meter-bar) {
		background: rgba(var(--color-surface-500), 0.5);
	}

	:global(html.dark .charge-meter::-moz-meter-optimum) {
		background: rgb(var(--color-success-500));
	}

	:global(html.dark .charge-meter::-moz-meter-sub-optimum) {
		background: rgb(var(--color-warning-500));
	}

	:global(html.dark .charge-meter::-moz-meter-sub-sub-optimum) {
		background: rgb(var(--color-error-500));
	}

	:global(html.dark .charge-meter::-ms-fill) {
		background: rgba(var(--color-surface-500), 0.5);
	}

	:global(html.dark .charge-meter::-ms-fill-lower) {
		background: rgb(var(--color-error-500));
	}

	:global(html.dark .charge-meter::-ms-fill-upper) {
		background: rgb(var(--color-success-500));
	}
</style>
