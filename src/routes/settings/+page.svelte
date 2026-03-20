<script lang="ts">
</script>

<div class="p-8 max-w-2xl mx-auto">
	<h1 class="text-3xl font-bold mb-8">Settings</h1>
	
	<div class="space-y-8">
		<!-- Section: General -->
		<section class="card bg-base-200 shadow-sm border border-base-300">
			<div class="card-body p-6">
				<h2 class="card-title text-xl mb-4">General</h2>
				<div class="form-control w-full">
					<label class="label cursor-pointer justify-start gap-4">
						<input type="checkbox" class="checkbox checkbox-primary" checked />
						<span class="label-text text-base font-medium">Show Hidden Files</span>
					</label>
					<p class="text-xs text-base-content/60 ml-10">Display files starting with a dot (.) in the browser.</p>
				</div>
                
				<div class="form-control w-full mt-4">
					<label class="label cursor-pointer justify-start gap-4">
						<input type="checkbox" class="checkbox checkbox-primary" checked />
						<span class="label-text text-base font-medium">Auto-play Videos</span>
					</label>
					<p class="text-xs text-base-content/60 ml-10">Videos will start playing automatically when opened.</p>
				</div>
			</div>
		</section>

		<!-- Section: Cache Management -->
		<section class="card bg-base-200 shadow-sm border border-base-300">
			<div class="card-body p-6">
				<h2 class="card-title text-xl mb-4 text-error">Danger Zone</h2>
				<div class="flex flex-col gap-4">
					<div class="flex items-center justify-between gap-4">
						<div>
							<h3 class="font-bold">Clear Thumbnail Cache</h3>
							<p class="text-sm text-base-content/60">Remove all generated thumbnails for files.</p>
						</div>
						<button class="btn btn-error btn-sm">Clear Cache</button>
					</div>
					<div class="divider my-1"></div>
					<div class="flex items-center justify-between gap-4">
						<div>
							<h3 class="font-bold">Reset All Settings</h3>
							<p class="text-sm text-base-content/60">Reset application state and preferences.</p>
						</div>
						<button class="btn btn-outline btn-error btn-sm">Reset</button>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>
