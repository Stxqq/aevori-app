import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
let output =
  'AEVORI — Third-party dependency notices\nGenerated from the installed lockfile. Includes build dependencies for completeness.\nModel weights are not distributed. Efferd retains separate terms in licenses/efferd.txt.\n';
const seen = new Set();
for (const [folder, meta] of Object.entries(lock.packages)) {
  if (!folder) continue;
  const dir = path.join(root, folder);
  let pkg, files;
  try {
    pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
    files = await readdir(dir);
  } catch {
    continue;
  }
  const key = pkg.name + '@' + pkg.version;
  if (seen.has(key)) continue;
  seen.add(key);
  output += `\n${'='.repeat(72)}\n${key}\nLicense: ${meta.license || pkg.license || 'See upstream'}\nSource: ${typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url || pkg.homepage || 'npm package registry'}\n`;
  const notices = files.filter((file) => /^(licen[sc]e|copying|notice)([.-]|$)/i.test(file));
  for (const file of notices) {
    try {
      output += '\n' + file + '\n' + (await readFile(path.join(dir, file), 'utf8')) + '\n';
    } catch {}
  }
  if (!notices.length)
    output += 'License metadata above; see the package source for its full terms.\n';
}
for (const file of [
  'licenses/elevenlabs-ui.txt',
  'licenses/shadcn-ui.txt',
  'licenses/efferd.txt',
  'licenses/react-remove-scroll-bar.txt',
  'public/ai-logos/LICENSE',
])
  output += `\n${'='.repeat(72)}\n${file}\n${await readFile(path.join(root, file), 'utf8')}\n`;
await writeFile(path.join(root, 'THIRD_PARTY_NOTICES.txt'), output);
console.log(`${seen.size} installed packages documented.`);
