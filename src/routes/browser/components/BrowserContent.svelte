<script lang="ts">
    import EmptyState from "$lib/components/EmptyState.svelte";
    import GroupViewHeader from "$lib/components/GroupViewHeader.svelte";
    import GalleryGrid from "$lib/components/GalleryGrid.svelte";
    import { browserStore as s } from "$lib/stores/browser.svelte";
    import { BadgeAlert } from "lucide-svelte";
    import { tick } from "svelte";

    // Trigger highlight when modals are closed
    let wasModalOpen = $state(false);
    
    $effect(() => {
        const isAnyModalOpen =
            s.isImageModalOpen ||
            s.isVideoModalOpen ||
            s.isWebtoonMode ||
            s.isAudioModalOpen ||
            s.isPdfReaderOpen;
            
        if (wasModalOpen && !isAnyModalOpen && s.lastOpenedFile) {
            const targetId = `item-${s.lastOpenedFile.replace(/[^a-zA-Z0-9]/g, "-")}`;
            setTimeout(() => {
                const el = document.getElementById(targetId);
                if (el) {
                    el.scrollIntoView({ behavior: "instant", block: "center" });
                    el.classList.add("ring-[1.5px]", "ring-primary", "z-10");
                    setTimeout(() => el.classList.remove("ring-[1.5px]", "ring-primary", "z-10"), 2500);
                }
            }, 0);
            s.lastOpenedFile = null;
        }
        wasModalOpen = isAnyModalOpen;
    });
</script>

<div class="p-4 sm:p-6 flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
    <!-- Error banner -->
    {#if s.errorMsg}
        <aside class="flex items-center gap-3 preset-filled-error-500 text-xs py-2 px-4 mb-6 rounded-xl w-full">
            <BadgeAlert size={18} class="shrink-0" />
            <span class="font-bold tracking-tight uppercase">{s.errorMsg}</span>
        </aside>
    {/if}

    <!-- Views -->
    {#if !s.isFolderSelected && !s.isLoading && !s.errorMsg}
        <EmptyState onOpenPicker={() => (s.isFolderPickerOpen = true)} />
    {:else if s.isFolderSelected}
        {#if s.currentExclusiveType}
            <GroupViewHeader
                currentExclusiveType={s.currentExclusiveType}
                onExit={s.handleExitGroupView}
            />
        {/if}

        <GalleryGrid
            bind:loadedImages={s.loadedImages}
            isGrouped={s.isGrouped}
            groupedData={s.groupedData}
            totalImages={s.totalMedia}
            currentPage={s.currentPage}
            hasMore={s.hasMore}
            isLoading={s.isLoading}
            PAGE_SIZE={s.PAGE_SIZE}
            onOpenModal={s.openModal}
            onOpenCbz={s.openCbzInWebtoon}
            onOpenDir={s.openDir}
            onLoadPage={(page) => s.loadFolder(false, page)}
            onOpenGroup={s.handleOpenGroup}
            coverFolders={s.coverFolders}
            coverFoldersTotal={s.coverFoldersTotal}
            coverFoldersPage={s.coverFoldersPage}
            coverFoldersHasMore={s.coverFoldersHasMore}
            isCoverMode={s.isCoverMode}
            onExitCoverMode={() => {
                s.isCoverMode = false;
                s.coverFolders = [];
            }}
            onCoverFolderClick={(path) => {
                const scrollContainer = document.querySelector(".drawer-content");
                if (scrollContainer) s.coverScrollPosition = scrollContainer.scrollTop;
                s.savedCoverState = {
                    path: s.normalizePath(s.folderPath),
                    folders: [...s.coverFolders],
                    total: s.coverFoldersTotal,
                    page: s.coverFoldersPage,
                    hasMore: s.coverFoldersHasMore,
                    scrollPos: s.coverScrollPosition,
                };
                s.isCoverMode = false;
                s.coverFolders = [];
                s.openDir(path);
            }}
            onLoadCoverPage={async (page) => {
                s.isLoading = true;
                try {
                    const res = await fetch(
                        `/api/file?action=covers&folder=${encodeURIComponent(s.folderPath)}&page=${page}&limit=${s.COVER_PAGE_SIZE}`
                    );
                    const data = await res.json();
                    s.coverFolders = data.folders;
                    s.coverFoldersPage = page;
                    s.coverFoldersHasMore = data.hasMore;
                } catch (e) {
                    console.error(e);
                } finally {
                    s.isLoading = false;
                }
            }}
        />
    {/if}
</div>
