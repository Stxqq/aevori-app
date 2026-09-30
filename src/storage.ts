/** Account-scoped AEVORI storage with a non-destructive migration of the local preview. */
export function workspaceStorage(role:string,id:string){
 const prefix=`aevori:${role==='owner'?'owner':id}:`;
 const key=(name:string)=>prefix+name.replace(/^aevori-/, '');
 return {
  read<T>(name:string,fallback:T):T{
   try{
    let raw=localStorage.getItem(key(name));
    const marker=`${prefix}migrated:${name}`;
    if(role==='owner'&&localStorage.getItem(marker)===null){
     const legacy=localStorage.getItem(name.replace(/^aevori-/, 'orbit-'))??localStorage.getItem(name);
     if(legacy!==null){
      const previous=JSON.parse(legacy),current=raw===null?null:JSON.parse(raw);
      if(['aevori-chats','aevori-notes','aevori-tasks'].includes(name)&&Array.isArray(previous)&&Array.isArray(current)){
       const merged=new Map(previous.map(item=>[item.id,item]));
       current.forEach(item=>merged.set(item.id,item));raw=JSON.stringify([...merged.values()]);
      }else if(raw===null)raw=legacy;
     }
     // A full browser store must not hide the readable legacy data.
     try{if(raw!==null)localStorage.setItem(key(name),raw);localStorage.setItem(marker,'1');}catch{/* Retry migration on the next read. */}
    }
    return raw===null?fallback:JSON.parse(raw)??fallback;
   }catch{return fallback;}
  },
  write(name:string,value:unknown){localStorage.setItem(key(name),JSON.stringify(value));}
 };
}
