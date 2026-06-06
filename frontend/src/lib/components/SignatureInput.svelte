<script>
	import { onMount, onDestroy } from 'svelte';
	import SignaturePad from 'signature_pad';

	export let value = '';
	export let width = 400;
	export let height = 200;

	let canvas;
	let signaturePad;

	onMount(() => {
		signaturePad = new SignaturePad(canvas, {
			backgroundColor: 'rgb(250, 250, 250)',
			penColor: 'rgb(0, 0, 0)'
		});
	});

	onDestroy(() => {
		if (signaturePad) {
			signaturePad.off();
		}
	});

	function clear() {
		signaturePad.clear();
		value = '';
	}

	function save() {
		if (!signaturePad.isEmpty()) {
			value = signaturePad.toDataURL('image/png');
		}
	}

	$: if (signaturePad && value) {
		signaturePad.fromDataURL(value);
	}
</script>

<div class="signature-container">
	<canvas
		bind:this={canvas}
		width={width}
		height={height}
		class="signature-canvas"
		on:mouseup={save}
		on:touchend={save}
	></canvas>
	<div class="mt-2 flex gap-2">
		<button type="button" class="btn btn-secondary text-sm" on:click={clear}>清除签名</button>
	</div>
</div>

<style>
	.signature-container {
		margin-top: 0.5rem;
	}
</style>
