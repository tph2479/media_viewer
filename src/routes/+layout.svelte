<script lang="ts">
    import "../app.css";
    import { page } from "$app/stores";
    import {
        BookIcon,
        HouseIcon,
        FolderTree,
        HardDriveDownload,
        SettingsIcon,
        Sun,
        Moon,
    } from "lucide-svelte";
    import { Navigation, Portal, Tooltip } from "@skeletonlabs/skeleton-svelte";
    import type { Snippet } from "svelte";
    import { fade, scale } from "svelte/transition";

    const { children }: { children: Snippet } = $props();

    // --- LOGIC DARK MODE ---
    let isDark = $state(false);

    $effect(() => {
        const mode = localStorage.getItem("mode") || "light";
        isDark = mode === "dark";
        document.documentElement.setAttribute("data-mode", mode);
    });

    const toggleMode = () => {
        isDark = !isDark;
        const mode = isDark ? "dark" : "light";
        document.documentElement.setAttribute("data-mode", mode);
        localStorage.setItem("mode", mode);
    };

    // --- CẤU HÌNH LINKS ---
    const links = [
        { label: "Home", href: "/", icon: HouseIcon },
        { label: "Gallery", href: "/gallery", icon: BookIcon },
        { label: "Browser", href: "/browser", icon: FolderTree },
        { label: "Import", href: "/import", icon: HardDriveDownload },
        { label: "Settings", href: "/settings", icon: SettingsIcon },
    ];

    // --- RESPONSIVE & PORTAL ---
    let isMobile = $state(false);
    let desktopTarget: HTMLElement | undefined = $state();
    let mobileTarget: HTMLElement | undefined = $state();

    $effect(() => {
        const mediaQuery = window.matchMedia("(max-width: 768px)");
        isMobile = mediaQuery.matches;
        const handler = (e: MediaQueryListEvent) => (isMobile = e.matches);
        mediaQuery.addEventListener("change", handler);
        return () => mediaQuery.removeEventListener("change", handler);
    });

    const isActive = (href: string) => {
        const currentPath = $page.url.pathname;
        return href === "/"
            ? currentPath === "/"
            : currentPath.startsWith(href);
    };
</script>

<svelte:head>
    <script>
        const savedMode = localStorage.getItem("mode") || "light";
        document.documentElement.setAttribute("data-mode", savedMode);
    </script>
</svelte:head>

{#snippet ThemeIconToggle()}
    <button
        onclick={toggleMode}
        class="flex flex-col items-center justify-center transition-all duration-300 hover:text-primary-500 active:scale-95
               {isMobile ? 'flex-1 py-2' : 'w-full py-6'}"
        aria-label="Toggle Theme"
    >
        <div class="relative size-6 flex items-center justify-center">
            {#if isDark}
                <div
                    class="absolute"
                    in:scale={{ duration: 400, start: 0.7, delay: 100 }}
                    out:fade={{ duration: 200 }}
                >
                    <div class="rotate-[-15deg]">
                        <Moon class="size-5 fill-current text-blue-400" />
                    </div>
                </div>
            {:else}
                <div
                    class="absolute"
                    in:scale={{ duration: 400, start: 0.7, delay: 100 }}
                    out:fade={{ duration: 200 }}
                >
                    <Sun
                        class="size-5 fill-current text-amber-500 shadow-amber-500/50"
                    />
                </div>
            {/if}
        </div>

        {#if isMobile}
            <span class="text-[10px] mt-1 font-medium opacity-60 tracking-wide">
                {isDark ? "Dark" : "Light"}
            </span>
        {/if}
    </button>
{/snippet}

{#snippet NavItem({ label, href, icon: Icon }: any)}
    {@const active = isActive(href)}
    <Tooltip
        openDelay={0}
        closeDelay={0}
        positioning={{ placement: isMobile ? "top" : "right" }}
    >
        <Tooltip.Trigger class={isMobile ? "flex-1" : "w-full"}>
            <Navigation.TriggerAnchor
                {href}
                class="flex flex-col md:flex-row justify-center items-center py-3 transition-all relative"
            >
                {#if active && !isMobile}
                    <div
                        class="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary-500 rounded-r-full"
                        transition:fade
                    ></div>
                {/if}
                <Icon
                    class="size-5 {active ? 'stroke-[2.5px]' : 'stroke-[2px]'}"
                />
                {#if isMobile}
                    <span class="text-[10px] mt-1 font-medium">{label}</span>
                {/if}
            </Navigation.TriggerAnchor>
        </Tooltip.Trigger>
        {#if !isMobile}
            <Portal>
                <Tooltip.Positioner class="z-50">
                    <Tooltip.Content
                        class="preset-filled-surface-950-50 text-xs px-3 py-1.5 rounded-md shadow-xl"
                    >
                        {label}
                    </Tooltip.Content>
                </Tooltip.Positioner>
            </Portal>
        {/if}
    </Tooltip>
{/snippet}

<div
    class="w-full h-dvh grid"
    class:grid-rows-[1fr_auto]={isMobile}
    class:grid-cols-[auto_1fr]={!isMobile}
>
    {#if !isMobile}
        <div bind:this={desktopTarget} class="w-16"></div>
    {/if}

    <main class="h-full overflow-y-auto">
        {@render children()}
    </main>

    {#if isMobile}
        <div bind:this={mobileTarget} class="w-full"></div>
    {/if}
</div>

<Portal target={isMobile ? mobileTarget : desktopTarget}>
    <Navigation
        layout={isMobile ? "bar" : "rail"}
        class="h-full w-full flex {isMobile ? 'flex-row' : 'flex-col'}"
    >
        <!-- {#if !isMobile}
            <Navigation.Header>
                {@render ThemeIconToggle()}
            </Navigation.Header>
        {/if} -->

        <Navigation.Content class="flex-1 {isMobile ? 'w-full' : ''}">
            <Navigation.Menu
                class={isMobile
                    ? "flex w-full justify-around items-center"
                    : "space-y-2"}
            >
                {#each links as link}
                    {@render NavItem(link)}
                {/each}

                <!-- {#if isMobile}
                    {@render ThemeIconToggle()}
                {/if} -->
            </Navigation.Menu>
        </Navigation.Content>
    </Navigation>
</Portal>
