/** Build a self-contained macOS web-app archive from an explicit allowlist. */
import {cp,mkdir,mkdtemp,readFile,writeFile,chmod,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const arch=process.argv[2]||process.arch;
if(!['arm64','x64'].includes(arch))throw new Error('Use arm64 or x64.');
const nodeVersion='22.23.3';
const version=JSON.parse(await readFile(path.join(root,'package.json'),'utf8')).version;
const output=path.join(root,'release');await mkdir(output,{recursive:true});
const stage=await mkdtemp(path.join(output,'.stage-'));
const bundle=path.join(stage,'Aevori');await mkdir(bundle);
for(const file of ['dist','server','shared','scripts/launch.mjs','package.json','Aevori starten.command','README.md','LICENSE','THIRD_PARTY_NOTICES.txt','ASSETS.md','licenses','ONLINE.md','SECURITY.md','docs/PUBLICATION.md','docs/MAC-POOL.md','docs/media/aevori-banner.png','docs/media/aevori-agent-dark.png']){
 await cp(path.join(root,file),path.join(bundle,file),{recursive:true});
}
const cache=path.join(root,'.runtime-cache');await mkdir(cache,{recursive:true});
const filename=`node-v${nodeVersion}-darwin-${arch}.tar.gz`,base=`https://nodejs.org/dist/v${nodeVersion}/`;
const fetchBytes=async(url)=>{const response=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!response.ok)throw new Error(`${response.status}: ${url}`);return Buffer.from(await response.arrayBuffer());};
const sums=(await fetchBytes(base+'SHASUMS256.txt')).toString();
const expected=sums.split('\n').find(line=>line.endsWith('  '+filename))?.split(' ')[0];
if(!expected)throw new Error('Official Node checksum is missing.');
const cached=path.join(cache,filename);let bytes;
try{bytes=await readFile(cached);}catch{bytes=await fetchBytes(base+filename);}
if(createHash('sha256').update(bytes).digest('hex')!==expected)throw new Error('Node checksum mismatch.');
await writeFile(cached,bytes);
execFileSync('tar',['-xzf',cached,'-C',stage]);
const runtime=path.join(stage,`node-v${nodeVersion}-darwin-${arch}`);
await cp(path.join(runtime,'bin/node'),path.join(bundle,'runtime/bin/node'));
await cp(path.join(runtime,'LICENSE'),path.join(bundle,'runtime/LICENSE'));
await writeFile(path.join(bundle,'runtime/SOURCE.txt'),`Official Node.js ${nodeVersion} (${arch})\n${base+filename}\nSHA-256: ${expected}\nSource: ${base}node-v${nodeVersion}.tar.gz\n`);
await chmod(path.join(bundle,'runtime/bin/node'),0o755);await chmod(path.join(bundle,'Aevori starten.command'),0o755);
await writeFile(path.join(bundle,'START-HERE.txt'),`AEVORI ${version} — Intelligence, locally.\n\n1. Move this entire Aevori folder somewhere permanent.\n2. Open Aevori starten.command. Your browser opens automatically.\n3. Keep the Terminal window open while using AEVORI. Control+C stops it.\n\nThe Node runtime is included; no npm or build commands are required.\nLocal AI needs Ollama and a model, installed separately: https://ollama.com/download\nFor example: ollama pull gemma3:4b\n\nThis is an unsigned preview, not a notarized native Mac app. macOS may require\nreview in System Settings > Privacy & Security before first launch. Verify the\nGitHub source and checksum; this package does not disable security protections.\n\nUse a modern macOS version compatible with Node 22 (macOS 11+).\nArchitecture: ${arch}. AEVORI runs at http://localhost:5190.\nData: ~/Library/Application Support/Aevori (agent, team); browser storage (chat).\nNo model weights, accounts, API keys, or personal data are bundled.\n\nhttps://github.com/Stxqq/aevori-app\n`);
const zip=path.join(output,`AEVORI-${version}-macOS-${arch}.zip`);
try{await stat(zip);throw new Error(`Refusing to overwrite ${zip}`);}catch(error){if(error.code!=='ENOENT')throw error;}
execFileSync('ditto',['-c','-k','--keepParent','--norsrc',bundle,zip]);
const hash=createHash('sha256').update(await readFile(zip)).digest('hex');
await writeFile(zip+'.sha256',`${hash}  ${path.basename(zip)}\n`);
console.log(JSON.stringify({archive:zip,sha256:hash,bundle,nodeVersion,arch}));
