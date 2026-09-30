// Tags and download sizes verified against the official Ollama library, 2026-09-29.
// RAM guidance is a conservative Aevori recommendation, not a vendor minimum.
export const MODEL_CATALOG = [
 {id:'qwen2.5-coder:7b',name:'Qwen Coder 7B',category:'Coding & Frontend',description:'Für Code, Fehlersuche und React-, HTML- oder CSS-Komponenten.',downloadGB:4.7,ramGB:16,source:'https://ollama.com/library/qwen2.5-coder:7b'},
 {id:'gemma3:4b',name:'Gemma 3 4B',category:'Ideen & Designtexte',description:'Für UX-Texte, Design-Briefings und Fragen zu Bildern oder Screenshots.',downloadGB:3.3,ramGB:8,source:'https://ollama.com/library/gemma3:4b'},
 {id:'qwen3-coder:30b',name:'Qwen3 Coder 30B',category:'Größere Code-Aufgaben',description:'Für komplexere Code-Fragen und umfangreiche Entwicklungsaufgaben.',downloadGB:19,ramGB:32,source:'https://ollama.com/library/qwen3-coder:30b'},
 {id:'devstral-small-2:24b',name:'Devstral Small 2',category:'Softwareentwicklung',description:'Ein Coding-Modell von Mistral für Code-Analyse und Refactoring.',downloadGB:15,ramGB:32,source:'https://ollama.com/library/devstral-small-2:24b'},
] as const;
export function modelInfo(id:string){return MODEL_CATALOG.find(model=>model.id===id);}
export function modelLabel(id:string){return /^muse-spark-/.test(id)?id.replace('muse-spark-','Muse Spark '):id==='__auto__'?'Automatische Modellwahl':id==='__pool__'?'Mac-Pool':modelInfo(id)?.name||id.replace(':latest','');}
