export class Semaphore {
	private tasks: (() => void)[] = [];
	private activeCount = 0;
	private concurrency: number;

	constructor(concurrency: number) {
		this.concurrency = concurrency;
	}

	async acquire(signal?: AbortSignal): Promise<void> {
		if (this.activeCount < this.concurrency) {
			this.activeCount++;
			return Promise.resolve();
		}

		return new Promise<void>((resolve, reject) => {
			const onAbort = () => {
				const idx = this.tasks.indexOf(resolve);
				if (idx > -1) {
					this.tasks.splice(idx, 1);
					reject(new Error('Aborted'));
				}
			};

			if (signal) {
				if (signal.aborted) return reject(new Error('Aborted'));
				signal.addEventListener('abort', onAbort, { once: true });
			}

			this.tasks.push(() => {
				if (signal) signal.removeEventListener('abort', onAbort);
				resolve();
			});
		});
	}

	release(): void {
		this.activeCount--;
		if (this.tasks.length > 0) {
			this.activeCount++;
			const next = this.tasks.shift();
			if (next) next();
		}
	}

	async run<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
		await this.acquire(signal);
		try {
			return await fn();
		} finally {
			this.release();
		}
	}
}

// Global semaphore for all CPU/IO intensive tasks
import os from 'node:os';
const cpus = os.cpus()?.length || 4;
// Limit concurrency to half of CPUs to leave room for the main thread and watcher
export const globalTaskSemaphore = new Semaphore(Math.max(2, Math.floor(cpus / 2)));
