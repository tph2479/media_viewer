<script lang="ts">
	import { tick, onMount, onDestroy } from 'svelte';
	import { isVideoFile, type ImageFile } from '$lib/utils/utils';
	import { cacheVersion } from '$lib/stores/cache.svelte';
	import { createWebtoonController } from './webtoonViewer.svelte.ts';
	import { X, Maximize2, ZoomIn, ZoomOut, Hash } from 'lucide-svelte';

	let {
		isWebtoonMode = $bindable(),
		folderPath,
		onCloseCallback
	}: {
		isWebtoonMode: boolean;
		folderPath: string;
		onCloseCallback?: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	const ctrl = createWebtoonController(folderPath);
	let s = $derived(ctrl.state);

	onMount(() => {
		ctrl.loadWebtoonFolder();
	});

	onDestroy(() => {
		ctrl.destroy();
	});

	function closeWebtoon() {
		isWebtoonMode = false;
		s.webtoonZoomLevel = 0.6;
		ctrl.destroy();
		if (onCloseCallback) onCloseCallback();
	}

	function trackImageIndex(node: HTMLElement, index: number) {
		const visObserver = new IntersectionObserver((entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					s.currentImageIndex = index;
					ctrl.cleanupOldSizes();
				}
			});
		}, {
			rootMargin: '0px 0px -50% 0px',
			threshold: 0
		});

		visObserver.observe(node);
		return { destroy() { visObserver.disconnect(); } };
	}

	function sentinelAction(node: HTMLElement) {
		const observer = new IntersectionObserver((entries) => {
			if (entries[0].isIntersecting && s.hasMore && !s.isLoading) {
				ctrl.loadMore();
			}
		}, { threshold: 0.1 });
		observer.observe(node);
		return { destroy() { observer.disconnect(); } };
	}

	$effect(() => {
		if (isWebtoonMode && s.webtoonScrollContainer) {
			s.webtoonScrollContainer.focus();
		}
	});

	function handleKeyDown(event: KeyboardEvent) {
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
		if (event.key === 'Escape') {
			closeWebtoon();
		}
		if (event.code === 'KeyZ') {
			event.preventDefault();
			ctrl.toggleWebtoonFit();
		}
	}

	let lastWidth = typeof window !== 'undefined' ? window.innerWidth : 0;
	let isResizing = false;
	function handleResize() {
		if (typeof window === 'undefined' || !s.webtoonScrollContainer || isResizing) return;
		const currentWidth = window.innerWidth;
		if (currentWidth === lastWidth) return;

		isResizing = true;

		const capturedIdx = s.currentImageIndex;
		const capturedImagePercent = s.anchorPercentInImage;
		const capturedDocPercent = s.lastScrollPercent;

		// 2. Symmetrical Zoom Switch
		if (lastWidth >= 640 && currentWidth < 640) {
			ctrl.setWebtoonZoom(1, undefined, { skipScroll: true });
		} else if (lastWidth < 640 && currentWidth >= 640) {
			ctrl.setWebtoonZoom(s.previousWebtoonZoom < 0.99 ? s.previousWebtoonZoom : 0.6, undefined, { skipScroll: true });
		}

		// 3. Clear any pending controller adjustments to ensure we have full control
		s.pendingScrollTop = null;
		lastWidth = currentWidth;

		// 4. Restore anchor: Primary is element-specific, fallback is document percentage
		tick().then(() => {
			if (s.webtoonScrollContainer) {
				const el = document.getElementById(`webtoon-image-${capturedIdx}`);
				if (el) {
					// 16px is the pt-4 padding on the container. el.offsetTop is relative to the inner content div.
					s.webtoonScrollContainer.scrollTop = 16 + el.offsetTop + (capturedImagePercent * el.offsetHeight);
				} else {
					s.webtoonScrollContainer.scrollTop = capturedDocPercent * s.webtoonScrollContainer.scrollHeight;
				}
			}
			isResizing = false;
		});
	}

	// Initial check for mobile fit
	onMount(() => {
		if (window.innerWidth < 640) {
			ctrl.setWebtoonZoom(1);
		}
	});
</script>

<style>
	:global(.webtoon-scroll) {
		scrollbar-width: none;
		overflow-anchor: none;
	}
	:global(.webtoon-scroll::-webkit-scrollbar) {
		display: none;
	}
</style>

<svelte:window onkeydown={handleKeyDown} onmousemove={ctrl.handleWindowMouseMove} onmouseup={ctrl.handleWindowMouseUp} onresize={handleResize} />

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={s.webtoonScrollContainer}
	tabindex="0"
	role="region"
	aria-label="Webtoon Reader"
	class="webtoon-scroll fixed inset-0 z-[300] bg-zinc-950 overflow-y-auto animate-in fade-in duration-200 focus:outline-none"
	onmousemove={ctrl.handleMouseMove}
	onscroll={(e) => {
		const target = e.currentTarget as HTMLElement;
		if (target.scrollHeight > 0 && !isResizing && s.pendingScrollTop === null) {
			s.lastScrollPercent = target.scrollTop / target.scrollHeight;

			// Pro-Reader Anchoring: Track precise offset into the current image
			const anchorEl = document.getElementById(`webtoon-image-${s.currentImageIndex}`);
			if (anchorEl) {
				const rect = anchorEl.getBoundingClientRect();
				const containerRect = target.getBoundingClientRect();
				s.anchorPercentInImage = (containerRect.top - rect.top) / rect.height;
			}
		}
	}}
	onwheel={(e) => {
		if (e.ctrlKey) {
			e.preventDefault();
			let delta = e.deltaY;
			if (e.deltaMode === 1) delta *= 33;
			else if (e.deltaMode === 2) delta *= window.innerHeight;

			const newZoom = Math.min(500, Math.max(0.001, s.webtoonZoomLevel * Math.pow(1.0015, -delta)));
			ctrl.setWebtoonZoom(newZoom, e.clientY);
		}
	}}
>
	<!-- Top Controls -->
	<div class="fixed top-4 right-4 sm:right-6 pointer-events-none z-[310] transition-all duration-300 {s.controlsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}">
		<div class="flex items-center justify-end gap-2">
			<button class="btn rounded-xl w-12 h-12 min-h-0 p-0 bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/10 backdrop-blur-xl shadow-2xl pointer-events-auto transition-all" aria-label="Toggle fit" onclick={(e) => { e.stopPropagation(); ctrl.toggleWebtoonFit(); }}>
				<Maximize2 class="h-5 w-5" />
			</button>
			<button aria-label="Close (ESC)" class="btn rounded-xl w-12 h-12 min-h-0 p-0 bg-zinc-900/90 hover:bg-zinc-800 text-white border border-white/10 backdrop-blur-xl shadow-2xl pointer-events-auto transition-all hover:scale-110" onclick={(e) => { e.stopPropagation(); closeWebtoon(); }}>
				<X class="h-6 w-6" />
			</button>
		</div>
	</div>

	<!-- Side Controls -->
	<div class="fixed top-24 right-4 sm:right-6 bottom-4 flex flex-col items-end gap-2 z-[310] pointer-events-none transition-all duration-300 {s.controlsVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}">
		<div class="flex flex-col items-end gap-2 pointer-events-auto h-full">
			<div class="flex flex-col bg-zinc-900/90 rounded-xl backdrop-blur-xl border border-white/10 shadow-2xl mt-1 w-12 overflow-hidden">
				<button aria-label="Zoom In" class="btn btn-ghost btn-sm h-12 w-12 p-0 text-white rounded-none border-b border-white/10" onclick={(e) => { e.stopPropagation(); ctrl.setWebtoonZoom(Math.min(500, s.webtoonZoomLevel * 1.15)); }} onmousedown={(e) => e.preventDefault()}>
					<ZoomIn class="h-5 w-5 m-auto" />
				</button>
				<span class="py-2 text-[10px] font-mono font-black text-white text-center bg-white/5 w-12" aria-label="Current Zoom">
					{Math.round(s.webtoonZoomLevel * 100)}%
				</span>
				<button aria-label="Zoom Out" class="btn btn-ghost btn-sm h-12 w-12 p-0 text-white rounded-none border-t border-white/10" onclick={(e) => { e.stopPropagation(); ctrl.setWebtoonZoom(Math.max(0.001, s.webtoonZoomLevel / 1.15)); }} onmousedown={(e) => e.preventDefault()}>
					<ZoomOut class="h-5 w-5 m-auto" />
				</button>
			</div>

			<div class="flex-1 flex flex-col items-center gap-2 mt-1 bg-zinc-900/90 py-4 rounded-xl border border-white/10 shadow-2xl pointer-events-auto w-12 backdrop-blur-xl px-0 relative">
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					bind:this={s.seekBarElement}
					class="flex-1 w-3 sm:w-4 bg-white/10 rounded-full overflow-hidden border border-white/5 shadow-inner my-1 cursor-pointer group hover:bg-white/20 transition-colors relative"
					onmousedown={ctrl.handleSeekBarMouseDown}
				>
					<div class="absolute top-0 left-0 w-full rounded-full transition-all duration-75 ease-out origin-top z-10 pointer-events-none" style="height: {s.smoothPercent}%; background-color: white;"></div>
					{#if s.isDraggingSeek && s.hasMoved}
						<div class="absolute top-0 left-0 w-full bg-white/30 rounded-full origin-top z-20 pointer-events-none" style="height: {s.previewPercent}%"></div>
					{/if}
				</div>
				<div class="flex flex-col items-center gap-1 mt-auto">
					<span class="text-sm font-mono font-black text-white/90">
						{Math.round(s.isDraggingSeek && s.hasMoved ? s.previewPercent : s.smoothPercent)}%
					</span>
					<div class="relative">
						<button
							aria-label="Edit Page Number"
							class="btn btn-ghost btn-circle w-10 h-10 min-h-0 p-0 text-white hover:bg-white/10 transition-all flex items-center justify-center"
							onclick={(e) => { e.stopPropagation(); s.isJumpPopupOpen = !s.isJumpPopupOpen; }}
							onmousedown={(e) => e.preventDefault()}
						>
							<Hash class="h-5 w-5" />
						</button>

						<!-- Jump Popup -->
						{#if s.isJumpPopupOpen}
							<div class="absolute right-full top-0 mr-4 bg-zinc-900/90 px-4 py-0 h-14 rounded-xl border border-white/10 backdrop-blur-xl shadow-2xl pointer-events-auto text-right flex items-center justify-center font-mono font-black text-sm focus:outline-none animate-in fade-in slide-in-from-right-4 duration-200 whitespace-nowrap">
								<span
									role="textbox"
									aria-label="Page number"
									tabindex="0"
									contenteditable="true"
									inputmode="numeric"
									class="text-white/90 focus:outline-none hover:bg-white/5 rounded px-1 transition-colors min-w-[1ch]"
									onfocus={(e) => {
										s.isEditingPage = true;
										if (s.hideTimerId) {
											clearTimeout(s.hideTimerId);
											s.hideTimerId = null;
										}
										const range = document.createRange();
										range.selectNodeContents(e.currentTarget);
										const sel = window.getSelection();
										sel?.removeAllRanges();
										sel?.addRange(range);
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											ctrl.handlePageInput(e.currentTarget.innerText);
											s.isJumpPopupOpen = false;
											e.currentTarget.blur();
										}
										e.stopPropagation();
									}}
									onblur={(e) => {
										s.isEditingPage = false;
										setTimeout(() => {
											if (!s.isEditingPage) {
												s.isJumpPopupOpen = false;
												s.webtoonScrollContainer?.focus();
											}
										}, 100);
										e.currentTarget.innerText = String(s.currentImageIndex + 1);
									}}
								>
									{s.currentImageIndex + 1}
								</span>
								<span class="text-white/40 ml-2">/ {s.totalImages}</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Nội dung Webtoon -->
	<div class="flex flex-col items-center pb-20 pt-4 min-h-dvh outline-none w-full">
		<div class="flex flex-col items-center" style="width: {s.webtoonZoomLevel * 100}%; max-width: none; flex-shrink: 0;">
			{#each s.loadedImages as img, i}
				{@const inBuffer = Math.abs(i - s.currentImageIndex) <= ctrl.BUFFER_SIZE}
				<!-- svelte-ignore a11y_missing_attribute -->
				<div
					id="webtoon-image-{i}"
					use:trackImageIndex={i}
					style="aspect-ratio: {s.aspectRatios[i] ?? 0.7};"
					class="w-full flex flex-col items-center justify-center border-b border-white/5 bg-black relative"
				>
					<img
						src={inBuffer ? `/api/media?path=${encodeURIComponent(img.path)}&v=${cacheVersion.value}` : undefined}
						alt=""
						class="w-full h-auto object-contain block m-0 p-0 pointer-events-none"
						onload={(e) => {
							const img = e.currentTarget as HTMLImageElement;
							if (img.naturalWidth && img.naturalHeight) {
								s.aspectRatios[i] = img.naturalWidth / img.naturalHeight;
							}
						}}
					/>
				</div>
			{/each}
		</div>

		{#if s.errorMsg}
		<div class="mt-8 mb-8 text-center text-sm font-medium" style="color: var(--color-error-500);">
			{s.errorMsg}
		</div>
		{/if}

		{#if s.hasMore}
			<div class="h-40 flex items-center justify-center w-full" use:sentinelAction>
				<div class="w-10 h-10 border-4 border-white/10 border-t-primary rounded-full animate-spin" style="border-top-color: var(--color-primary-500);"></div>
			</div>
		{:else}
			<div class="mt-12 mb-20 text-center text-white/50 text-sm font-medium">
				— End of Images ({s.totalImages}) —
			</div>
		{/if}
	</div>
</div>
