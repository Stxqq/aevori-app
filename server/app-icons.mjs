import {createHash} from 'node:crypto';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile),icons=new Map(),pending=new Set();
// Only bundle paths discovered by the OS process list can register an icon.
export function appBundleFromCommand(command){const end=command.indexOf('.app/');return command.startsWith('/')&&end>0?command.slice(0,end+4):null;}
export function processIcon(command){
 const bundle=appBundleFromCommand(command);if(!bundle)return undefined;
 const id=createHash('sha256').update(bundle).digest('hex').slice(0,24);
 if(!icons.has(id)&&!pending.has(id)){
  if(icons.size+pending.size>=256)return undefined;
  pending.add(id);
  void (async()=>{let dir;try{
   const {stdout}=await exec('/usr/bin/plutil',['-extract','CFBundleIconFile','raw','-o','-',path.join(bundle,'Contents/Info.plist')],{timeout:2000});
   const file=stdout.trim();if(!file||path.basename(file)!==file)throw new Error('Invalid icon');
   const source=path.join(bundle,'Contents/Resources',path.extname(file)?file:file+'.icns');
   dir=await mkdtemp(path.join(tmpdir(),'aevori-app-icon-'));
   const target=path.join(dir,'icon.png');
   await exec('/usr/bin/sips',['-s','format','png','--resampleHeightWidthMax','96',source,'--out',target],{timeout:4000});
   const data=await readFile(target);icons.set(id,data.length<=1024*1024?data:null);
  }catch{icons.set(id,null);}finally{pending.delete(id);if(dir)await rm(dir,{recursive:true,force:true});}})();
 }
 return icons.get(id)?`/api/app-icon/${id}`:undefined;
}
export function getAppIcon(id){return /^[a-f0-9]{24}$/.test(id)?icons.get(id):undefined;}
