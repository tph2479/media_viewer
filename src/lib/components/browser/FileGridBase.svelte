<script lang="ts">
    import { type ImageFile } from "$lib/utils/utils";
    import FileCard from "../FileCard.svelte";
    import { FolderOpen } from "lucide-svelte";

    type FileActions = {
        openDir: (path: string) => void;
        openCbz: (path: string) => void;
        openModal: (index: number, items: ImageFile[]) => void;
    };

    let {
        items = $bindable([]),
        isLoading = false,
        highlightedPath = null,
        actions,
    }: {
        items?: ImageFile[];
        isLoading?: boolean;
        highlightedPath?: string | null;
        actions: FileActions;
    } = $props();
</script>

{#if items.length === 0}
    {#if isLoading}
        {#each Array.from({ length: 12 }) as _}
            <div class="flex flex-col gap-2 animate-pulse">
                <div
                    class="aspect-square bg-surface-200 dark:bg-surface-800 rounded-2xl w-full"
                ></div>
                <div
                    class="h-3 bg-surface-200 dark:bg-surface-800 rounded-full w-2/3 mx-auto"
                ></div>
            </div>
        {/each}
    {:else}
        <div
            class="col-span-full flex flex-col items-center justify-center opacity-60 bg-surface-200/30 dark:bg-surface-800/30 p-10 text-center min-h-75"
        >
            <FolderOpen size={56} strokeWidth={1} class="mb-4 opacity-20" />
            <p
                class="text-base font-black uppercase tracking-tight mb-2 text-surface-900 dark:text-surface-100"
            >
                No files found
            </p>
            <p
                class="text-[11px] font-bold uppercase tracking-widest opacity-50 mb-4"
            >
                This directory contains no supported media
            </p>
            <div class="flex flex-wrap justify-center gap-1.5 max-w-sm">
                {#each ["JPG", "PNG", "WEBP", "AVIF", "GIF", "BMP", "HEIC"] as fmt}
                    <span
                        class="badge badge-sm font-black opacity-60 bg-success/10 text-success border-success/20"
                        >{fmt}</span
                    >
                {/each}
                {#each ["MP4", "WEBM", "MKV", "AVI", "MOV", "FLV", "M4V"] as fmt}
                    <span
                        class="badge badge-sm font-black opacity-60 bg-info/10 text-info border-info/20"
                        >{fmt}</span
                    >
                {/each}
                {#each ["MP3", "WAV", "FLAC", "OGG", "M4A", "AAC", "OPUS"] as fmt}
                    <span
                        class="badge badge-sm font-black opacity-60 bg-warning/10 text-warning border-warning/20"
                        >{fmt}</span
                    >
                {/each}
                {#each ["CBZ", "PDF", "EPUB"] as fmt}
                    <span
                        class="badge badge-sm font-black opacity-60 bg-error/10 text-error border-error/20"
                        >{fmt}</span
                    >
                {/each}
            </div>
        </div>
    {/if}
{:else}
    {#each items as _, i}
        <FileCard
            bind:img={items[i]}
            index={i}
            highlighted={highlightedPath === items[i].path}
            actions={{
                openDir: actions.openDir,
                openCbz: actions.openCbz,
                openModal: (idx) => actions.openModal(idx, items),
            }}
        />
    {/each}
{/if}

