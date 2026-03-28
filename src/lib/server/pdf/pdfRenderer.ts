import { createCanvas } from '@napi-rs/canvas';
import fs from 'node:fs/promises';

// We need to polyfill DOMMatrix for pdfjs-dist in Node environment
if (!(globalThis as any).DOMMatrix) {
  (globalThis as any).DOMMatrix = class DOMMatrix {
    a: number; b: number; c: number; d: number; e: number; f: number;
    constructor(arg?: number[]) {
      if (Array.isArray(arg)) {
        this.a = arg[0]; this.b = arg[1]; this.c = arg[2]; this.d = arg[3]; this.e = arg[4]; this.f = arg[5];
      } else {
        this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
      }
    }
  };
}

// @ts-ignore
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * Renders the first page of a PDF to a PNG buffer with optimal scaling.
 * 
 * @param pdfPath Absolute path to the PDF file.
 * @param targetWidth The desired width for the thumbnail (to optimize CPU/Memory usage).
 */
export async function renderPdfFirstPage(pdfPath: string, targetWidth: number = 400): Promise<Buffer> {
  let data = new Uint8Array(await fs.readFile(pdfPath));
  let pdf: any = null;

  try {
    const loadingTask = pdfjs.getDocument({
      data,
      verbosity: 0,
      stopAtErrors: false,
    });

    pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    
    // 1. Calculate the optimal scale
    // We want to render at roughly targetWidth to save memory/CPU
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scale = targetWidth / unscaledViewport.width;
    const viewport = page.getViewport({ scale });
    
    // 2. High-speed Canvas rendering
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext('2d');

    await (page.render({
      canvasContext: context as any,
      viewport: viewport,
    } as any)).promise;

    // 3. Fast PNG encoding (lowest compression is faster for local IPC)
    const buffer = await canvas.encode('png');
    
    return buffer;
  } finally {
    // 4. Reliable Memory Cleanup
    if (pdf) {
      await pdf.destroy();
    }
    // Help GC with large buffer
    (data as any) = null;
  }
}
