<script lang="ts">
    import { browserStore as s } from "$lib/stores/browser.svelte";
    import FolderGrid from "./FolderGrid.svelte";
    import NormalGrid from "./NormalGrid.svelte";
    import GroupedGrid from "./GroupedGrid.svelte";

    let {
        highlightedPath = null,
    }: {
        highlightedPath?: string | null;
    } = $props();

    const actions = {
        openModal: s.actions.openModal,
        openCbz: s.actions.openCbzInWebtoon,
        openDir: s.actions.openDir,
        openGroup: s.actions.handleOpenGroup,
    };
</script>

{#if s.cover.enabled && s.cover.folders.length > 0}
    <FolderGrid
        folders={s.cover.folders}
        total={s.cover.total}
        page={s.cover.page}
        pageSize={s.pagination.pageSize}
        isLoading={s.ui.isLoading}
        onFolderClick={s.actions.handleCoverFolderClick}
        onExit={s.actions.exitCoverMode}
        onPageChange={s.actions.loadCoverPage}
    />
{:else if s.content.isGrouped}
    <GroupedGrid
        bind:groupedData={s.content.groupedData}
        isLoading={s.ui.isLoading}
        {highlightedPath}
        {actions}
    />
{:else}
    <NormalGrid
        bind:items={s.content.items}
        total={s.content.totals.media}
        isLoading={s.ui.isLoading}
        {highlightedPath}
        pagination={{
            currentPage: s.pagination.currentPage,
            hasMore: s.pagination.hasMore,
            pageSize: s.pagination.pageSize,
            onPageChange: s.actions.loadNextPage,
        }}
        {actions}
    />
{/if}
