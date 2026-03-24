<script lang="ts">
	import WebtoonReader from './viewers/webtoon/WebtoonViewer.svelte';
	import ImageModal from './viewers/image/ImageViewer.svelte';
	import VideoModal from './viewers/video/VideoPlayer.svelte';
	import AudioModal from './viewers/audio/AudioPlayer.svelte';
	import PdfReader from './viewers/pdf/PdfViewer.svelte';
	import FolderPicker from './FolderPicker.svelte';
    import { browserStore as s } from '$lib/stores/browser.svelte';
</script>

{#if s.isWebtoonMode}
	<WebtoonReader
		bind:isWebtoonMode={s.isWebtoonMode}
		folderPath={s.webtoonActivePath}
		onCloseCallback={() => { s.webtoonCbzPath = ""; }}
	/>
{/if}

{#if s.isImageModalOpen && s.loadedImages.length > s.selectedImageIndex}
	<ImageModal
		bind:isModalOpen={s.isImageModalOpen}
		bind:selectedImageIndex={s.selectedImageIndex}
		loadedImages={s.loadedImages}
		totalImages={s.totalImagesCount}
		hasMore={s.hasMore}
		currentPage={s.currentPage}
		loadFolder={s.loadFolder}
		isGrouped={s.isGrouped}
		onSwitchToPagination={s.handleSwitchToPaginationToContinue}
	/>
{/if}

{#if s.isPdfReaderOpen}
	<PdfReader
		bind:isPdfMode={s.isPdfReaderOpen}
		pdfPath={s.selectedPdfPath}
		onCloseCallback={() => s.selectedPdfPath = ''}
	/>
{/if}

{#if s.isVideoModalOpen && s.loadedImages.length > s.selectedImageIndex}
	<VideoModal
		bind:isModalOpen={s.isVideoModalOpen}
		bind:selectedImageIndex={s.selectedImageIndex}
		loadedImages={s.loadedImages}
		totalImages={s.totalVideosCount}
		hasMore={s.hasMore}
		currentPage={s.currentPage}
		loadFolder={s.loadFolder}
		isGrouped={s.isGrouped}
		onSwitchToPagination={s.handleSwitchToPaginationToContinue}
		onSwitchToAudio={() => { s.isVideoModalOpen = false; s.isAudioModalOpen = true; }}
	/>
{/if}

{#if s.isAudioModalOpen && s.loadedImages.length > s.selectedImageIndex}
	<AudioModal
		bind:isModalOpen={s.isAudioModalOpen}
		bind:selectedImageIndex={s.selectedImageIndex}
		loadedImages={s.loadedImages}
		totalImages={s.totalAudioCount}
		hasMore={s.hasMore}
		currentPage={s.currentPage}
		loadFolder={s.loadFolder}
		isGrouped={s.isGrouped}
		onSwitchToPagination={s.handleSwitchToPaginationToContinue}
		onSwitchToVideo={() => { s.isAudioModalOpen = false; s.isVideoModalOpen = true; }}
	/>
{/if}

{#if s.isFolderPickerOpen}
	<FolderPicker
		bind:isFolderPickerOpen={s.isFolderPickerOpen}
		bind:folderPath={s.folderPath}
		availableDrives={s.availableDrives}
		isDrivesLoading={s.isDrivesLoading}
		onRefreshDrives={s.refreshDrives}
		onSelect={() => {
			const savedPage = s.folderPageHistory[s.folderPath] || 0;
			s.mediaType = 'all';
			s.isCoverMode = false;
			s.coverFolders = [];
			s.loadFolder(true, savedPage);
		}}
		onOpenFile={(path, type) => {
			s.pendingFile = { path, type };
		}}
	/>
{/if}
