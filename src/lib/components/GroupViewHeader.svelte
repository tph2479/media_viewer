<script lang="ts">
    import { ArrowLeft } from "lucide-svelte";
    let {
        currentExclusiveType,
        onExit,
    }: { currentExclusiveType: string; onExit: () => void } = $props();
</script>

<div
    class="flex items-center justify-between bg-surface-800-500 backdrop-blur-md animate-in fade-in slide-in-from-top-2"
>
    <div class="flex items-center gap-3">
        <button class="btn" onclick={onExit} aria-label="Back to Group View">
            <ArrowLeft class="w-5 h-5 text-base-content" />
        </button>
        <span class="font-bold tracking-tight uppercase text-sm"
            >Viewing: {currentExclusiveType}
        </span>
    </div>
</div>
