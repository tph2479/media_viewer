// Đệm lưu trữ HEIC Blob URLs để tránh convert nhiều lần
export const heicCache = new Map<string, string>();

// Fallback ảnh lỗi hoặc xử lý HEIC/HEIF kể cả khi bị sai đuôi file
export async function handleImageError(event: Event, imgPath: string) {
	const target = event.target as HTMLImageElement;
	const originalSrc = target.src;
	let loadingIndicator = target.nextElementSibling as HTMLElement;
	const originalSvg = loadingIndicator ? loadingIndicator.innerHTML : '';

	target.style.display = 'none';
	if (loadingIndicator) {
		loadingIndicator.style.display = 'flex';
		loadingIndicator.innerHTML = '<span class="loading loading-spinner loading-lg text-primary opacity-50"></span>';
	}

	try {
		// Prevent infinite loops if the image consistently fails
		if (target.dataset.retried === originalSrc) {
			console.warn("Image consistently failing:", imgPath);
			return;
		}
		target.dataset.retried = originalSrc;

		// Just wait a moment and retry once without heavy processing
		await new Promise(resolve => setTimeout(resolve, 500));
		target.onerror = null; // Prevent infinite loop on this específicos element
		target.src = originalSrc + (originalSrc.includes('?') ? '&' : '?') + 'retry=' + Date.now();
		target.style.display = 'block';
		if (loadingIndicator) loadingIndicator.style.display = 'none';
	} catch (err) {
		console.warn("Image recovery failed:", err);
	}
}

// Kiểm tra đuôi file video
export function isVideoFile(filename: string) {
	const ext = filename.toLowerCase().split('.').pop();
	return ext === 'mp4' || ext === 'webm';
}

export function isZipFile(filename: string) {
	return filename.toLowerCase().endsWith('.zip');
}

export function isCbzFile(filename: string) {
	return filename.toLowerCase().endsWith('.cbz');
}

// Chuyển đổi bytes sang KB/MB
export function formatBytes(bytes: number, decimals = 2) {
	if (!+bytes) return '0 Bytes';
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(ms: number) {
	return new Date(ms).toLocaleDateString();
}

export function formatDateTime(ms: number) {
	return new Date(ms).toLocaleString();
}

export type ImageFile = { name: string; path: string; size: number; lastModified: number; isCbz?: boolean; isDir?: boolean; isVideo?: boolean; width?: number; height?: number };
