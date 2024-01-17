<script lang="ts">
	import '../app.pcss';
	import { autoModeWatcher } from '@skeletonlabs/skeleton';
	import { initializeStores } from '@skeletonlabs/skeleton';

	import { LightSwitch, Modal } from '@skeletonlabs/skeleton';
	import type { ModalComponent } from '@skeletonlabs/skeleton';
	import FileInvoiceConfirmModal from '$lib/components/FileInvoiceConfirmModal.svelte';

	const modalRegistry: Record<string, ModalComponent> = {
		modalFileInvoiceConfirm: { ref: FileInvoiceConfirmModal }
	};

	initializeStores();
</script>

<svelte:head>
	{@html `<script>${autoModeWatcher.toString()} autoModeWatcher();</script>`}
</svelte:head>
<Modal components={modalRegistry} buttonTextCancel="Avbryt" />
<slot />
<div class="fixed bottom-0 right-0 z-50 p-4">
	<LightSwitch />
</div>
