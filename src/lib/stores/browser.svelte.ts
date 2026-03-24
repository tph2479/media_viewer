import { tick } from "svelte";
import type { ImageFile } from "$lib/utils/utils";

const PAGE_SIZE = 60;
const COVER_PAGE_SIZE = 60;

export function createBrowserStore() {
    let folderPath = $state("");
    let isFolderSelected = $state(false);
    let isLoading = $state(false);
    let errorMsg = $state("");

    let loadedImages = $state<ImageFile[]>([]);
    let totalImagesCount = $state(0);
    let totalVideosCount = $state(0);
    let totalAudioCount = $state(0);
    let totalEbookCount = $state(0);
    let totalMedia = $state(0);
    let currentPage = $state(0);
    let hasMore = $state(false);

    let currentSort = $state("date_desc");
    let mediaType = $state<"all" | "images" | "videos" | "audio" | "ebook">("all");

    let availableDrives = $state<any[]>([]);

    let isImageModalOpen = $state(false);
    let isVideoModalOpen = $state(false);
    let isAudioModalOpen = $state(false);
    let isPdfReaderOpen = $state(false);
    let selectedImageIndex = $state(0);
    let isWebtoonMode = $state(false);
    let isFolderPickerOpen = $state(false);
    let isDrivesLoading = $state(false);
    let isNoImagesPopupOpen = $state(false);
    let noImagesPopupTimer = $state<any>(null);

    let webtoonCbzPath = $state("");

    type CoverFolder = { name: string; path: string; coverPath: string };
    let coverFolders = $state<CoverFolder[]>([]);
    let coverFoldersTotal = $state(0);
    let coverFoldersPage = $state(0);
    let coverFoldersHasMore = $state(false);
    let isCoverMode = $state(false);

    let savedCoverState = $state<{
        path: string;
        folders: CoverFolder[];
        total: number;
        page: number;
        hasMore: boolean;
        scrollPos: number;
    } | null>(null);

    let selectedPdfPath = $state("");
    let pendingFile = $state<{ path: string; type: "media" | "cbz" | "pdf" } | null>(null);
    let lastOpenedFolder = $state<string | null>(null);
    let lastOpenedFile = $state<string | null>(null);

    let folderPageHistory = $state<Record<string, number>>({});

    const webtoonActivePath = $derived(webtoonCbzPath || folderPath);

    let isPinned = $state(true);
    let showHeader = $state(true);

    let isGrouped = $state(false);
    let groupedData = $state<any>(null);
    let currentExclusiveType = $state<string | null>(null);
    let lastLoadedPath = $state("");
    let groupScrollPosition = $state(0);
    let coverScrollPosition = $state(0);

    function normalizePath(p: string) {
        if (!p) return p;
        let res = p.trim();
        if (res.length === 2 && res[1] === ":") {
            res += "\\";
        } else if (res.length > 3 && (res.endsWith("\\") || res.endsWith("/"))) {
            res = res.slice(0, -1);
        }
        return res;
    }

    async function refreshDrives() {
        isDrivesLoading = true;
        try {
            const res = await fetch("/api/file?action=directories&path=");
            if (res.ok) {
                const data = await res.json();
                availableDrives = data.directories;
            }
        } catch (e) {
            console.error("Failed to load drives:", e);
        } finally {
            isDrivesLoading = false;
        }
    }

    async function loadFolder(reset = true, pageToLoad = 0, append = false) {
        if (!folderPath.trim()) {
            errorMsg = "Please enter a directory path.";
            return;
        }

        isLoading = true;
        errorMsg = "";

        folderPath = normalizePath(folderPath);
        const targetPath = folderPath;
        const targetId = lastOpenedFolder
            ? `item-${lastOpenedFolder.replace(/[^a-zA-Z0-9]/g, "-")}`
            : null;

        if (reset && targetPath !== lastLoadedPath) {
            currentExclusiveType = null;
        }
        lastLoadedPath = targetPath;

        if (reset) {
            currentPage = pageToLoad;
            hasMore = false;
            loadedImages = [];
        } else {
            currentPage = pageToLoad;
            if (!append) loadedImages = [];
        }

        try {
            if (typeof window !== "undefined" && !append && !targetId) {
                const scrollContainer = document.querySelector(".drawer-content") || document.scrollingElement;
                if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: "instant" });
            }

            const exclusiveParam = currentExclusiveType ? `&exclusiveType=${currentExclusiveType}` : "";
            const res = await fetch(
                `/api/file?action=gallery&folder=${encodeURIComponent(targetPath)}&page=${currentPage}&limit=${PAGE_SIZE}&sort=${currentSort}&type=${mediaType}${exclusiveParam}`
            );
            const data = await res.json();

            if (!res.ok) throw new Error(data.message || "Error fetching data from server.");

            isGrouped = data.isGrouped || false;
            if (isGrouped) {
                groupedData = data.groups;
                loadedImages = [];
            } else {
                groupedData = null;
                loadedImages = append ? [...loadedImages, ...data.images] : data.images;
            }

            if (reset) {
                isFolderSelected = true;
                localStorage.setItem("last-path", targetPath);
            }

            totalImagesCount = data.totalImages;
            totalVideosCount = data.totalVideos;
            totalAudioCount = data.totalAudio;
            totalEbookCount = data.totalEbook;
            totalMedia = data.total;
            hasMore = data.hasMore;

            folderPageHistory[targetPath] = currentPage;
            sessionStorage.setItem("hello-folder-history", JSON.stringify(folderPageHistory));

            if (targetId) {
                tick().then(() => {
                    const el = document.getElementById(targetId);
                    if (el) {
                        el.scrollIntoView({ behavior: "instant", block: "center" });
                        el.classList.add("ring-[1.5px]", "ring-primary", "z-10");
                        setTimeout(() => el.classList.remove("ring-[1.5px]", "ring-primary", "z-10"), 2500);
                    }
                    lastOpenedFolder = null;
                });
            }

            if (pendingFile) {
                if (pendingFile.type === "cbz") {
                    openCbzInWebtoon(pendingFile.path);
                } else if (pendingFile.type === "pdf") {
                    openPdfReader(pendingFile.path);
                } else {
                    const idx = loadedImages.findIndex((img) => img.path === pendingFile!.path);
                    if (idx !== -1) openModal(idx);
                }
                pendingFile = null;
            }
        } catch (e: any) {
            errorMsg = e.message;
            if (reset) isFolderSelected = false;
        } finally {
            isLoading = false;
        }
    }

    function openModal(index: number, items?: ImageFile[]) {
        const sourceList = items || loadedImages;
        const img = sourceList[index];
        if (!img) return;

        if (items) loadedImages = items;
        selectedImageIndex = index;

        if (img.isVideo) isVideoModalOpen = true;
        else if (img.isAudio) isAudioModalOpen = true;
        else if (img.isPdf) openPdfReader(img.path);
        else if (img.isEpub) console.log("EPUB clicked:", img.path);
        else isImageModalOpen = true;
    }

    function openPdfReader(path: string) {
        selectedPdfPath = path;
        isPdfReaderOpen = true;
    }

    function openDir(dirPath: string, isGoingUp = false) {
        const normalized = normalizePath(dirPath);
        lastOpenedFolder = isGoingUp ? folderPath : null;

        folderPath = normalized;
        localStorage.setItem("last-path", normalized);
        currentExclusiveType = null;
        mediaType = "all";
        isCoverMode = false;
        coverFolders = [];

        const savedPage = folderPageHistory[normalized] || 0;
        loadFolder(true, savedPage);
    }

    function openCbzInWebtoon(cbzPath: string) {
        webtoonCbzPath = cbzPath;
        isWebtoonMode = true;
    }

    function showPopup() {
        isNoImagesPopupOpen = true;
        if (noImagesPopupTimer) clearTimeout(noImagesPopupTimer);
        noImagesPopupTimer = setTimeout(() => {
            isNoImagesPopupOpen = false;
            noImagesPopupTimer = null;
        }, 3000);
    }

    async function handleOpenWebtoon() {
        if (isCoverMode) {
            isCoverMode = false;
            coverFolders = [];
            return;
        }

        if (webtoonCbzPath) {
            isWebtoonMode = true;
            return;
        }

        isLoading = true;
        try {
            const imgRes = await fetch(
                `/api/file?action=gallery&folder=${encodeURIComponent(folderPath)}&page=0&limit=1&imagesOnly=true`
            );
            const imgData = await imgRes.json();
            if (imgData.total > 0) {
                isWebtoonMode = true;
                return;
            }

            const coverRes = await fetch(
                `/api/file?action=covers&folder=${encodeURIComponent(folderPath)}&page=0&limit=${COVER_PAGE_SIZE}`
            );
            const coverData = await coverRes.json();
            if (coverData.total > 0) {
                coverFolders = coverData.folders;
                coverFoldersTotal = coverData.total;
                coverFoldersPage = 0;
                coverFoldersHasMore = coverData.hasMore;
                isCoverMode = true;
                return;
            }

            showPopup();
        } catch (e) {
            console.error(e);
        } finally {
            isLoading = false;
        }
    }

    async function handleSwitchToPaginationToContinue() {
        const firstItem = loadedImages[0];
        if (!firstItem) return;

        let key = "images";
        if (firstItem.isVideo) key = "videos";
        else if (firstItem.isAudio) key = "audio";
        else if (firstItem.isPdf) key = "pdf";
        else if (firstItem.isCbz) key = "cbz";
        else if (firstItem.isEpub) key = "epub";

        const scrollContainer = document.querySelector(".drawer-content");
        if (scrollContainer) groupScrollPosition = scrollContainer.scrollTop;
        currentExclusiveType = key;
        await loadFolder(true, 0);
    }

    return {
        // Expose state as getters/setters for runes
        get folderPath() { return folderPath; }, set folderPath(v) { folderPath = v; },
        get isFolderSelected() { return isFolderSelected; }, set isFolderSelected(v) { isFolderSelected = v; },
        get isLoading() { return isLoading; }, set isLoading(v) { isLoading = v; },
        get errorMsg() { return errorMsg; }, set errorMsg(v) { errorMsg = v; },
        get loadedImages() { return loadedImages; }, set loadedImages(v) { loadedImages = v; },
        get totalImagesCount() { return totalImagesCount; }, set totalImagesCount(v) { totalImagesCount = v; },
        get totalVideosCount() { return totalVideosCount; }, set totalVideosCount(v) { totalVideosCount = v; },
        get totalAudioCount() { return totalAudioCount; }, set totalAudioCount(v) { totalAudioCount = v; },
        get totalEbookCount() { return totalEbookCount; }, set totalEbookCount(v) { totalEbookCount = v; },
        get totalMedia() { return totalMedia; }, set totalMedia(v) { totalMedia = v; },
        get currentPage() { return currentPage; }, set currentPage(v) { currentPage = v; },
        get hasMore() { return hasMore; }, set hasMore(v) { hasMore = v; },
        get currentSort() { return currentSort; }, set currentSort(v) { currentSort = v; },
        get mediaType() { return mediaType; }, set mediaType(v) { mediaType = v; },
        get availableDrives() { return availableDrives; }, set availableDrives(v) { availableDrives = v; },
        
        get isImageModalOpen() { return isImageModalOpen; }, set isImageModalOpen(v) { isImageModalOpen = v; },
        get isVideoModalOpen() { return isVideoModalOpen; }, set isVideoModalOpen(v) { isVideoModalOpen = v; },
        get isAudioModalOpen() { return isAudioModalOpen; }, set isAudioModalOpen(v) { isAudioModalOpen = v; },
        get isPdfReaderOpen() { return isPdfReaderOpen; }, set isPdfReaderOpen(v) { isPdfReaderOpen = v; },
        get selectedImageIndex() { return selectedImageIndex; }, set selectedImageIndex(v) { selectedImageIndex = v; },
        get isWebtoonMode() { return isWebtoonMode; }, set isWebtoonMode(v) { isWebtoonMode = v; },
        get isFolderPickerOpen() { return isFolderPickerOpen; }, set isFolderPickerOpen(v) { isFolderPickerOpen = v; },
        get isDrivesLoading() { return isDrivesLoading; }, set isDrivesLoading(v) { isDrivesLoading = v; },
        get isNoImagesPopupOpen() { return isNoImagesPopupOpen; }, set isNoImagesPopupOpen(v) { isNoImagesPopupOpen = v; },
        get noImagesPopupTimer() { return noImagesPopupTimer; }, set noImagesPopupTimer(v) { noImagesPopupTimer = v; },
        get webtoonCbzPath() { return webtoonCbzPath; }, set webtoonCbzPath(v) { webtoonCbzPath = v; },
        get webtoonActivePath() { return webtoonActivePath; },

        get coverFolders() { return coverFolders; }, set coverFolders(v) { coverFolders = v; },
        get coverFoldersTotal() { return coverFoldersTotal; }, set coverFoldersTotal(v) { coverFoldersTotal = v; },
        get coverFoldersPage() { return coverFoldersPage; }, set coverFoldersPage(v) { coverFoldersPage = v; },
        get coverFoldersHasMore() { return coverFoldersHasMore; }, set coverFoldersHasMore(v) { coverFoldersHasMore = v; },
        get isCoverMode() { return isCoverMode; }, set isCoverMode(v) { isCoverMode = v; },
        get savedCoverState() { return savedCoverState; }, set savedCoverState(v) { savedCoverState = v; },

        get selectedPdfPath() { return selectedPdfPath; }, set selectedPdfPath(v) { selectedPdfPath = v; },
        get pendingFile() { return pendingFile; }, set pendingFile(v) { pendingFile = v; },
        get lastOpenedFolder() { return lastOpenedFolder; }, set lastOpenedFolder(v) { lastOpenedFolder = v; },
        get lastOpenedFile() { return lastOpenedFile; }, set lastOpenedFile(v) { lastOpenedFile = v; },
        get folderPageHistory() { return folderPageHistory; }, set folderPageHistory(v) { folderPageHistory = v; },

        get isPinned() { return isPinned; }, set isPinned(v) { isPinned = v; },
        get showHeader() { return showHeader; }, set showHeader(v) { showHeader = v; },
        get isGrouped() { return isGrouped; }, set isGrouped(v) { isGrouped = v; },
        get groupedData() { return groupedData; }, set groupedData(v) { groupedData = v; },
        get currentExclusiveType() { return currentExclusiveType; }, set currentExclusiveType(v) { currentExclusiveType = v; },
        get groupScrollPosition() { return groupScrollPosition; }, set groupScrollPosition(v) { groupScrollPosition = v; },
        get coverScrollPosition() { return coverScrollPosition; }, set coverScrollPosition(v) { coverScrollPosition = v; },
        get PAGE_SIZE() { return PAGE_SIZE; },
        get COVER_PAGE_SIZE() { return COVER_PAGE_SIZE; },

        // Methods
        normalizePath,
        refreshDrives,
        loadFolder,
        openModal,
        openPdfReader,
        openDir,
        openCbzInWebtoon,
        showPopup,
        handleOpenWebtoon,
        handleSwitchToPaginationToContinue,
        
        // Group logic specifically extracted
        handleExitGroupView() {
            currentExclusiveType = null;
            loadFolder(true, 0).then(() => {
                tick().then(() => {
                    const scrollContainer = document.querySelector(".drawer-content");
                    if (scrollContainer) scrollContainer.scrollTo({ top: groupScrollPosition, behavior: "instant" });
                });
            });
        },
        handleOpenGroup(type: string) {
            const scrollContainer = document.querySelector(".drawer-content");
            if (scrollContainer) groupScrollPosition = scrollContainer.scrollTop;
            currentExclusiveType = type;
            loadFolder(true, 0); // Always start at page 0 for exclusive view
        }
    };
}

// Global singleton instance for the browser route
export const browserStore = createBrowserStore();
