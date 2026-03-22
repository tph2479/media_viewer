import { json } from '@sveltejs/kit';
import fs from 'node:fs/promises';
import path from 'node:path';

const COVER_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp']);

export async function handleCovers(folderPath: string, page: number = 0, limit: number = 30) {
	const entries = await fs.readdir(folderPath, { withFileTypes: true });
	const dirs = entries.filter(e => e.isDirectory());

	// For each subdirectory, look for a cover.* file
	const coverResults = await Promise.all(
		dirs.map(async (dir) => {
			const dirPath = path.join(folderPath, dir.name);
			try {
				const children = await fs.readdir(dirPath);
				const coverFile = children.find(f => {
					const lower = f.toLowerCase();
					const ext = path.extname(lower);
					const base = path.basename(lower, ext);
					return base === 'cover' && COVER_EXTENSIONS.has(ext);
				});
				if (coverFile) {
					return {
						name: dir.name,
						path: dirPath,
						coverPath: path.join(dirPath, coverFile)
					};
				}
			} catch {
				// Skip directories we can't read
			}
			return null;
		})
	);

	const folders = coverResults.filter(Boolean) as { name: string; path: string; coverPath: string }[];

	// Sort by name
	folders.sort((a, b) => a.name.localeCompare(b.name));

	const total = folders.length;
	const start = page * limit;
	const end = start + limit;
	const paginated = folders.slice(start, end);

	return json({
		folders: paginated,
		total,
		page,
		hasMore: end < total
	});
}
