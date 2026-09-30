import test from 'node:test';
import assert from 'node:assert/strict';
import {generationSettings,usageFromEvent} from '../server/generation.mjs';
import {appBundleFromCommand,getAppIcon} from '../server/app-icons.mjs';
test('Generationseinstellungen sind begrenzt und echte Token-Zahlen bleiben unverfälscht',()=>{
 assert.equal(generationSettings({responseLength:'long',creativity:'precise'}).maxTokens,4096);
 assert.equal(generationSettings({responseLength:'unlimited',creativity:100}).temperature,.7);
 assert.equal(usageFromEvent({message:{content:'Text'}}),null);
 assert.deepEqual(usageFromEvent({prompt_eval_count:20,eval_count:60,eval_duration:2e9}),{inputTokens:20,outputTokens:60,tokensPerSecond:30});
 assert.deepEqual(usageFromEvent({usage:{prompt_tokens:15,completion_tokens:10}}),{inputTokens:15,outputTokens:10,tokensPerSecond:null});
});
test('App-Symbole verwenden erkannte App-Bundles und keine frei adressierbaren Dateien',()=>{
 assert.equal(appBundleFromCommand('/Applications/Test.app/Contents/Frameworks/Helper.app/Contents/MacOS/Helper'),'/Applications/Test.app');
 assert.equal(appBundleFromCommand('/usr/libexec/kernel'),null);
 assert.equal(getAppIcon('../../etc/passwd'),undefined);
});
