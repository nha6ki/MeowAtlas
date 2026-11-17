const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const output=process.env.MEOW_TEST_OUTPUT_DIR||'work/touch-check';
fs.mkdirSync(output,{recursive:true});
const base=process.env.MEOW_TEST_URL||'http://127.0.0.1:8767/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
 const result={base,gestures:[],errors:[],failures:[]};
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  page.setDefaultTimeout(12000);
  page.on('pageerror',e=>result.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)result.failures.push(r.url());});
  const cdp=await page.context().newCDPSession(page);
  await page.goto(base);await page.waitForFunction(()=>document.querySelector('#experience-map').dataset.touchState==='idle');
  await page.evaluate(()=>{window.layoutCalls=0;const f=Plotly.relayout;Plotly.relayout=function(...args){layoutCalls++;return f.apply(this,args);};});
  const original=await page.evaluate(()=>JSON.stringify(MEOW_ATLAS.points.map(p=>p.coordinates)));
  const view=()=>page.evaluate(()=>{const m=document.querySelector('#experience-map'),r=m.getBoundingClientRect(),x=m._fullLayout.xaxis,y=m._fullLayout.yaxis;return{x:[...x.range],y:[...y.range],width:x._length,height:y._length,left:r.left+x._offset,top:r.top+y._offset,scale:visualViewport.scale,calls:layoutCalls,header:document.querySelector('header').getBoundingClientRect().toJSON(),selected:m.dataset.selectedId};});
  async function fullViewport(){
   const value=await page.evaluate(()=>{const m=document.querySelector('#experience-map'),l=m._fullLayout;return {height:m.clientHeight,clipHeight:l.yaxis._length,margin:l.margin.t+l.margin.b,xScale:l.xaxis._length/(l.xaxis.range[1]-l.xaxis.range[0]),yScale:l.yaxis._length/(l.yaxis.range[1]-l.yaxis.range[0]),domains:[l.xaxis.domain,l.yaxis.domain]};});
   assert(Math.abs(value.clipHeight-(value.height-value.margin))<1);
   assert(Math.abs(value.xScale-value.yScale)<1e-7);
   assert.deepEqual(value.domains,[[0,1],[0,1]]);
  }
  await fullViewport();
  // Points near both ends of the tall viewport must be visible and tappable.
  for(const fraction of [.08,.92]){
   const target=await page.evaluate(async fraction=>{
    const m=document.querySelector('#experience-map'),p=MEOW_ATLAS.points[100],l=m._fullLayout;
    const xSpan=l.xaxis.range[1]-l.xaxis.range[0],ySpan=l.yaxis.range[1]-l.yaxis.range[0];
    await Plotly.relayout(m,{'xaxis.range':[p.coordinates[0]-xSpan/2,p.coordinates[0]+xSpan/2],
     'yaxis.range':[p.coordinates[1]-(1-fraction)*ySpan,p.coordinates[1]+fraction*ySpan]});
    const box=m.getBoundingClientRect(),x=m._fullLayout.xaxis,y=m._fullLayout.yaxis;
    return {id:p.id,x:box.left+x._offset+x._length/2,y:box.top+y._offset+y._length*fraction};
   },fraction);
   await page.touchscreen.tap(target.x,target.y);
   await page.waitForFunction(id=>document.querySelector('#voice-card').dataset.id===id,target.id);
   await page.locator('#experience-audio').evaluate(a=>a.pause());await page.locator('#close-voice').tap();
  }
  await page.locator('#experience-reset-view').tap();
  const dispatch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
  const pause=()=>new Promise(r=>setTimeout(r,18));
  async function pinch(name,dx,dy,factor,cx=195,cy=365){
   const before=await view();const point=(x,y,id)=>({x,y,id});
   await dispatch('touchStart',[point(cx-dx,cy-dy,0),point(cx+dx,cy+dy,1)]);
   for(let n=1;n<=10;n++){
    const f=1+(factor-1)*n/10;await dispatch('touchMove',[point(cx-dx*f,cy-dy*f,0),point(cx+dx*f,cy+dy*f,1)]);await pause();
   }
   const moving=await page.evaluate(()=>document.querySelector('#experience-map .scatterlayer').getAttribute('transform'));
   assert(moving?.startsWith('matrix('));assert.equal((await view()).calls,before.calls);
   await dispatch('touchEnd',[]);await page.waitForFunction(()=>document.querySelector('#experience-map').dataset.touchState==='idle');
   const after=await view();
   const ratio=(before.x[1]-before.x[0])/(after.x[1]-after.x[0]);
   assert(Math.abs(ratio-factor)<.025,`${name}: ratio ${ratio}, expected ${factor}`);
   assert(Math.abs((before.y[1]-before.y[0])/(after.y[1]-after.y[0])-factor)<.025);
   const anchorBefore=[before.x[0]+(cx-before.left)/before.width*(before.x[1]-before.x[0]),before.y[1]-(cy-before.top)/before.height*(before.y[1]-before.y[0])];
   const anchorAfter=[after.x[0]+(cx-after.left)/after.width*(after.x[1]-after.x[0]),after.y[1]-(cy-after.top)/after.height*(after.y[1]-after.y[0])];
   assert(Math.abs(anchorBefore[0]-anchorAfter[0])<.02);assert(Math.abs(anchorBefore[1]-anchorAfter[1])<.02);
   assert.equal(after.scale,1);assert.deepEqual(after.header,before.header);assert.equal(after.selected,before.selected);
   assert.equal(after.calls-before.calls,1);
   result.gestures.push({name,zoomFactor:ratio,pageScale:after.scale,layoutUpdates:after.calls-before.calls,anchorStable:true});
  }
  await pinch('horizontal spread',40,0,2);
  await pinch('horizontal pinch',80,0,.5);
  await pinch('vertical spread through blank map area',0,110,1.5);
  await pinch('vertical pinch',0,110,2/3);
  await pinch('diagonal spread',30,40,1.6);
  await pinch('diagonal pinch',48,64,.625);
  console.log('Directional pinch checks passed');
  // A one-finger pan can transition into a pinch and back without selecting a clip.
  const before=await view();
  await dispatch('touchStart',[{x:130,y:340,id:0}]);
  await dispatch('touchMove',[{x:145,y:350,id:0}]);await pause();
  await dispatch('touchStart',[{x:145,y:350,id:0},{x:225,y:350,id:1}]);
  await dispatch('touchMove',[{x:125,y:350,id:0},{x:245,y:350,id:1}]);await pause();
  await dispatch('touchEnd',[{x:125,y:350,id:0}]);
  await dispatch('touchMove',[{x:140,y:360,id:0}]);await pause();
  await dispatch('touchEnd',[]);await page.waitForFunction(()=>document.querySelector('#experience-map').dataset.touchState==='idle');
  const after=await view();assert.equal(after.selected,before.selected);assert(after.x[1]-after.x[0]<before.x[1]-before.x[0]);assert.equal(after.scale,1);
  // Cancelling restores the last committed view and cannot trigger playback.
  const beforeCancel=await view();
  await dispatch('touchStart',[{x:130,y:350,id:0},{x:230,y:350,id:1}]);
  await dispatch('touchMove',[{x:100,y:350,id:0},{x:260,y:350,id:1}]);await pause();
  await dispatch('touchCancel',[]);await page.waitForFunction(()=>document.querySelector('#experience-map').dataset.touchState==='idle');
  const cancelled=await view();assert.deepEqual(cancelled.x,beforeCancel.x);assert.deepEqual(cancelled.y,beforeCancel.y);
  assert.equal(await page.locator('#experience-map .scatterlayer').getAttribute('transform'),null);
  await page.locator('#experience-reset-view').tap();
  const point=await page.locator('#experience-map .scatterlayer .trace').nth(1).locator('path.point').nth(100).boundingBox();
  await page.touchscreen.tap(point.x+point.width/2,point.y+point.height/2);
  await page.waitForFunction(()=>document.querySelector('#experience-audio').currentTime>0&&document.querySelector('#voice-breed-photo').dataset.loaded);
  const selected=await page.locator('#voice-card').getAttribute('data-id');assert(selected);
  await page.locator('#experience-audio').evaluate(a=>a.pause());
  await pinch('pinch with audio card open',35,25,1.3,195,330);
  assert.equal(await page.locator('#voice-card').getAttribute('data-id'),selected);
  assert.deepEqual(await page.evaluate(()=>JSON.stringify(MEOW_ATLAS.points.map(p=>p.coordinates))),original);
  const beforeRotation=await view();
  for(let round=0;round<2;round++)for(const size of [{width:844,height:390},{width:390,height:844}]){
   await page.setViewportSize(size);
   await page.waitForFunction(()=>{const m=document.querySelector('#experience-map');return m._fullLayout.width===m.clientWidth&&m._fullLayout.height===m.clientHeight;});
   await fullViewport();
  }
  const afterRotation=await view();
  for(const axis of ['x','y'])for(let i=0;i<2;i++)assert(Math.abs(afterRotation[axis][i]-beforeRotation[axis][i])<1e-7,'Repeated rotation must preserve the view');
  for(const width of [320,360,390,700,844,1440]){
   await page.setViewportSize({width,height:width===844?390:844});
   await page.waitForFunction(w=>document.querySelector('#experience-map').data[1].marker.size===(w<=700?4.5:5.5),width);
   const sizes=await page.locator('#voice-card').evaluate(card=>{const r=card.getBoundingClientRect();return {width:r.width,height:r.height,inner:card.clientWidth,scroll:card.scrollWidth,play:document.querySelector('#play-voice').getBoundingClientRect().width,close:document.querySelector('#close-voice').getBoundingClientRect().width};});
   assert(sizes.scroll<=sizes.inner);assert(sizes.play>=44);assert(sizes.close>=44);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('#close-voice').tap();await page.locator('#open-picker').tap();
  await page.locator('#picker-cat').selectOption('DAK01');await page.locator('#picker-search').fill('SIM01_308');await page.locator('.picker-row').tap();
  await page.waitForFunction(()=>document.querySelector('#experience-audio').currentTime>0);
  await page.locator('#experience-audio').evaluate(a=>a.pause());
  await page.locator('#analysis-link').tap();await page.waitForFunction(()=>document.querySelector('#atlas-map').dataset.ready==='true');
  assert.equal(await page.locator('#atlas-map').getAttribute('data-selected-id'),'I_DAK01_MC_FN_SIM01_308');
  assert.deepEqual(result.errors,[]);assert.deepEqual(result.failures,[]);result.status='passed';
  result.extraChecks=['full-height viewport','upper and lower point selection','equal axis scales','repeated rotation preserves view','pan-pinch-pan transition','touch cancellation','no gesture selection','tap playback','audio card remains usable','320–1440px responsive card','44px controls','picker playback','Analysis handoff','fixed coordinates'];
  fs.writeFileSync(`${output}/${base.startsWith('https')?'production':'local'}-verification.json`,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
