<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import BrowserHeader from "./components/BrowserHeader.svelte";
    import BrowserContent from "./components/BrowserContent.svelte";
    import BrowserNotifications from "./components/BrowserNotifications.svelte";
    import GalleryModals from "$lib/components/GalleryModals.svelte";
    import { browserStore as s } from "$lib/stores/browser.svelte";

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    onMount(async () => {
        const saved = localStorage.getItem("last-path");
        if (saved) s.folderPath = saved;

        const savedHistory = sessionStorage.getItem("hello-folder-history");
        if (savedHistory) {
            try {
                s.folderPageHistory = JSON.parse(savedHistory);
            } catch (e) {
                console.error("Failed to parse folder history");
            }
        }

        // Load drives ONCE on startup
        await s.refreshDrives();

        // Auto load last folder if exists
        if (s.folderPath) {
            s.folderPath = s.normalizePath(s.folderPath);
            const savedPage = s.folderPageHistory[s.folderPath] || 0;
            s.loadFolder(true, savedPage);
        }
    });

    // Handle orientation change for responsive grid
    function handleOrientationChange() {
        window.dispatchEvent(new Event("resize"));
    }

    onMount(() => {
        window.addEventListener("orientationchange", handleOrientationChange);
        return () => {
            window.removeEventListener(
                "orientationchange",
                handleOrientationChange,
            );
        };
    });

    onDestroy(() => {
        s.reset();
    });
</script>

<div class="flex flex-col relative w-full h-full">
    <BrowserHeader />
    <BrowserContent />
</div>

<!-- Modals & Popups -->
<GalleryModals />
<BrowserNotifications />
