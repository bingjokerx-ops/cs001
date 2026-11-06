import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const analyticsSource = readFileSync(new URL('assets/analytics.js',import.meta.url),'utf8');
function browser({choice=null,internal=false,preview=false,blockedStorage=false,measurementId='G-CC5FRCJJMW'}={}) {
  const listeners = new Map();
  const values = new Map([['guide-analytics-choice-v1',choice],['guide-internal-test-v1',String(internal)]]);
  const scripts = [];
  const buttons = ['denied','granted'].map(value=>({dataset:{analyticsChoice:value},addEventListener:(_,listener)=>listeners.set(value,listener)}));
  const banner = {hidden:true,querySelector:()=>({focus(){}})};
  const status = {textContent:''};
  const window = {};
  const location = {origin:preview?'http://127.0.0.1:4191':'https://howbetter.online',hostname:preview?'127.0.0.1':'howbetter.online',pathname:'/',reload(){location.reloaded=true;}};
  const document = {
    title:'Monster Survivors',referrer:'https://example.com/private?secret=value',cookie:'',
    querySelector:selector=>selector.includes('script')?{dataset:{analyticsId:measurementId,analyticsOrigin:'https://howbetter.online'}}:selector==='#analytics-choice'?banner:status,
    querySelectorAll:selector=>selector==='[data-analytics-choice]'?buttons:[],
    addEventListener:(name,listener)=>listeners.set(name,listener),
    createElement:()=>({}),head:{append:script=>scripts.push(script)},
  };
  const localStorage = {
    getItem:key=>{if(blockedStorage)throw new DOMException('Storage blocked','SecurityError');return values.get(key)??null;},
    setItem:(key,value)=>{if(blockedStorage)throw new DOMException('Storage blocked','SecurityError');values.set(key,value);},
  };
  runInNewContext(analyticsSource,{window,location,document,localStorage,DOMException,URL,console:{warn(){}}});
  return {window,location,document,banner,status,scripts,choose:value=>listeners.get(value)(),emit:(name,detail)=>listeners.get(name)?.({detail}),events:()=>Array.from(window.dataLayer??[],entry=>Array.from(entry)).filter(entry=>entry[0]==='event')};
}
test('no Google tag before permission, after denial, in preview, internal testing or unavailable storage',()=>{
  for(const options of [{},{choice:'denied'},{choice:'granted',preview:true},{choice:'granted',internal:true},{blockedStorage:true}]) {
    const page=browser(options);
    page.emit('howbetter-game-launch');
    page.emit('howbetter-guide-feedback',{helpful:'yes'});
    assert.equal(page.scripts.length,0,JSON.stringify(options));
    assert.equal(page.events().length,0,JSON.stringify(options));
  }
});
test('one page view and limited intentions/feedback after acceptance, without free text or referrer queries',()=>{
  const page=browser();page.choose('granted');page.choose('granted');
  page.emit('howbetter-game-launch');page.emit('howbetter-game-reload');page.emit('howbetter-guide-feedback',{helpful:'no',text:'private comment'});
  assert.equal(page.scripts.length,1);
  assert.deepEqual(page.events().map(entry=>entry[1]),['page_view','game_launch','game_reload','guide_feedback']);
  assert.equal(JSON.stringify(page.events()).includes('private'),false);
  assert.equal(JSON.stringify(page.events()).includes('secret'),false);
});
test('withdrawal stops future events and reloads the page to remove the tag',()=>{
  const page=browser({choice:'granted'});page.choose('denied');page.emit('howbetter-game-launch');
  assert.equal(page.window['ga-disable-G-CC5FRCJJMW'],true);
  assert.equal(page.events().length,1);
  assert.equal(page.location.reloaded,true);
});
test('invalid identifiers and feedback fail explicitly',()=>{
  assert.throws(()=>browser({measurementId:'wrong-account'}),/Invalid Howbetter measurement ID: wrong-account/);
  const page=browser({choice:'granted'});
  assert.throws(()=>page.emit('howbetter-guide-feedback',{helpful:'private text'}),/Invalid Howbetter feedback value: private text/);
});
