// Writes .gz and .br siblings for text assets in the build output.
// http-server's --gzip/--brotli flags only serve pre-compressed files, so
// without this step everything goes over the wire uncompressed.
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const root = process.argv[2] ?? 'dist/camilo404-site/browser';
const compressible = /\.(js|mjs|css|html|svg|json|txt|xml|webmanifest)$/;
const minBytes = 1024;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

let raw = 0;
let brotli = 0;
for await (const file of walk(root)) {
  if (!compressible.test(file) || (await stat(file)).size < minBytes) continue;
  const data = await readFile(file);
  const br = brotliCompressSync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } });
  await writeFile(`${file}.gz`, gzipSync(data, { level: 9 }));
  await writeFile(`${file}.br`, br);
  raw += data.length;
  brotli += br.length;
}

console.log(`Pre-compressed ${(raw / 1024).toFixed(1)} kB -> ${(brotli / 1024).toFixed(1)} kB (brotli) in ${root}`);
