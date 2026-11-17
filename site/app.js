(() => {
  'use strict';
  const data=window.MEOW_ATLAS,byId=id=>document.getElementById(id),map=byId('atlas-map'),audio=byId('audio-player'),canvas=byId('spectrogram');
  if(!data||!window.Plotly){byId('app-error').hidden=false;byId('app-error').textContent='地図のデータを読み込めませんでした。画面を開き直してください。';return;}
  const contexts=['B','F','I'],names={B:'ブラッシング',F:'食事待ち',I:'隔離'};
  const indices=new Map(data.points.map((p,i)=>[p.id,i])),cats=[...new Set(data.points.map(p=>p.cat))].sort(),storageKey='meowatlas-listening-atlas-v1';
  const profile=cat=>data.catProfiles?.[cat]?.description||'',catLabel=cat=>[cat,profile(cat)].filter(Boolean).join(' · ');
  const categoryValues={breed:['MC','EU'],sex:['F','M'],neuter:['N','I']};
  const baseState={breed:'all',sex:'all',neuter:'all',cat:'all',contexts:[...contexts],selectedId:null,relatedMode:'feature',comparisonRange:'near',comparisonId:null};
  const comparisonAudio=byId('comparison-audio'),comparisonCanvas=byId('comparison-spectrogram');
  let comparisonImage=null,comparisonAssetId=null,comparisonImageToken=0,comparisonAnimation=0,selectionTarget='A';
  const clipCounts=new Map(),clipNumbers=data.points.map(p=>{const key=p.cat+':'+p.context,n=(clipCounts.get(key)||0)+1;clipCounts.set(key,n);return String(n).padStart(2,'0');});
  const normalize=value=>value.normalize('NFKC').toLocaleLowerCase().trim();
  let state={...baseState},rendering=false,requested=0,image=null,assetId=null,imageToken=0,animation=0;
  try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved?.version===1){state={...Object.fromEntries(Object.entries(categoryValues).map(([key,values])=>[key,values.includes(saved[key])?saved[key]:'all'])),cat:cats.includes(saved.cat)?saved.cat:'all',contexts:Array.isArray(saved.contexts)?contexts.filter(c=>saved.contexts.includes(c)):[...contexts],selectedId:indices.has(saved.selectedId)?saved.selectedId:null,relatedMode:saved.relatedMode==='map'?'map':'feature',comparisonRange:saved.comparisonRange==='far'?'far':'near',comparisonId:indices.has(saved.comparisonId)?saved.comparisonId:null};}}catch(_){}
  const incoming=new URLSearchParams(location.search).get('clip');
  if(indices.has(incoming)){if(state.selectedId!==incoming)state.comparisonId=null;state.selectedId=incoming;state.breed=state.sex=state.neuter=state.cat='all';state.contexts=[...contexts];}
  function matchesCategory(cat){const p=data.catProfiles?.[cat];return(state.breed==='all'||p?.breedCode===state.breed)&&(state.sex==='all'||p?.sexCode?.[0]===state.sex)&&(state.neuter==='all'||p?.sexCode?.[1]===state.neuter);}
  const matchesCat=cat=>matchesCategory(cat)&&(state.cat==='all'||cat===state.cat);
  const visible=()=>data.points.map((p,i)=>i).filter(i=>matchesCat(data.points[i].cat)&&state.contexts.includes(data.points[i].context));
  if(state.cat!=='all'&&!matchesCategory(state.cat))state.cat='all';
  if(!visible().some(i=>data.points[i].id===state.selectedId))state.selectedId=null;
  function save(){try{localStorage.setItem(storageKey,JSON.stringify({version:1,...state}));}catch(_){}}
  function palette(){const s=getComputedStyle(document.documentElement);return{fg:s.getPropertyValue('--ink').trim(),muted:s.getPropertyValue('--muted').trim(),bg:s.getPropertyValue('--surface').trim(),line:s.getPropertyValue('--line').trim(),B:s.getPropertyValue('--brush').trim(),F:s.getPropertyValue('--food').trim(),I:s.getPropertyValue('--isolation').trim()};}
  function renderCatOptions(){
    const allowed=cats.filter(matchesCategory),select=byId('cat-filter');select.replaceChildren();
    const all=document.createElement('option');all.value='all';all.textContent=allowed.length===cats.length?'すべての猫':allowed.length?`該当するすべての猫（${allowed.length}匹）`:'該当する猫はいません';select.append(all);
    allowed.forEach(cat=>{const option=document.createElement('option');option.value=cat;option.textContent=`${catLabel(cat)} · ${data.points.filter(p=>p.cat===cat).length}件`;select.append(option);});
    select.value=state.cat;select.disabled=!allowed.length;
  }
  function renderClipOptions(){
    const terms=normalize(byId('clip-search').value).split(/\s+/).filter(Boolean),select=byId('clip-select');
    const shown=visible().filter(i=>terms.every(term=>normalize(`${catLabel(data.points[i].cat)} ${data.points[i].id} ${names[data.points[i].context]}`).includes(term)));
    select.replaceChildren();const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent=shown.length?'点または音声を選択':'該当する音声はありません';select.append(placeholder);
    shown.forEach(i=>{const p=data.points[i],option=document.createElement('option');option.value=p.id;option.textContent=`${p.cat} · ${names[p.context]} ${clipNumbers[i]} · ${p.duration.toFixed(2)}秒`;select.append(option);});
    select.value=(selectionTarget==='B'?state.comparisonId:state.selectedId)||'';select.disabled=!shown.length;byId('clip-search-count').textContent=shown.length+'件';
  }
  function renderControls(){
    syncSelectionTarget();const shown=visible();renderClipOptions();renderCatOptions();
    Object.keys(categoryValues).forEach(key=>{byId(key+'-filter').value=state[key];});
    document.querySelectorAll('.context-filter input').forEach(input=>{input.checked=state.contexts.includes(input.value);});
    contexts.forEach(c=>{byId('count-'+c).textContent=data.points.filter(p=>matchesCat(p.cat)&&p.context===c).length;});
    byId('visible-count').textContent=`${shown.length} / 440 音声を表示`;
    byId('map-empty').hidden=!!shown.length;byId('choose-first').disabled=!shown.length;
    byId('related-mode').value=state.relatedMode;
  }
  async function renderMap(){
    requested++;if(rendering)return;rendering=true;
    try{let completed;do{
      completed=requested;const shown=visible(),t=palette(),selectedId=state.selectedId,selected=indices.get(selectedId),compared=indices.get(state.comparisonId);
      const ranges={x:[...(map._fullLayout?.xaxis.range||data.bounds.x)],y:[...(map._fullLayout?.yaxis.range||data.bounds.y)]};
      const traces=[{type:'scatter',mode:'markers',x:shown.map(i=>data.points[i].coordinates[0]),y:shown.map(i=>data.points[i].coordinates[1]),ids:shown.map(i=>data.points[i].id),customdata:shown,
        hoverinfo:'none',
        marker:{size:6,opacity:.86,color:shown.map(i=>t[data.points[i].context]),symbol:'circle',line:{width:.5,color:t.bg}},showlegend:false},
        {type:'scatter',mode:'markers+text',x:selected===undefined?[]:[data.points[selected].coordinates[0]],y:selected===undefined?[]:[data.points[selected].coordinates[1]],customdata:selected===undefined?[]:[selected],text:selected===undefined?[]:['A'],textposition:'top center',textfont:{color:t.fg,size:12},
         hoverinfo:'skip',showlegend:false,marker:{size:18,symbol:'circle-open',color:t.fg,line:{width:1.25}}},
        {type:'scatter',mode:'markers+text',x:compared===undefined?[]:[data.points[compared].coordinates[0]],y:compared===undefined?[]:[data.points[compared].coordinates[1]],customdata:compared===undefined?[]:[compared],text:compared===undefined?[]:['B'],textposition:'bottom center',textfont:{color:t.fg,size:12},
         hoverinfo:'skip',showlegend:false,marker:{size:18,symbol:'circle-open',color:t.fg,line:{width:1.25}}}];
      const axis={showgrid:false,zeroline:false,showline:true,linecolor:t.line,linewidth:1,showticklabels:true,ticks:'outside',ticklen:3,tickcolor:t.muted,tickfont:{color:t.muted,size:10},nticks:5,automargin:true,fixedrange:false,autorange:false,constrain:'domain'};
      const axisTitle=text=>({text,standoff:8,font:{color:t.muted,size:11}});
      await Plotly.react(map,traces,{autosize:true,height:map.clientHeight,margin:{l:54,r:22,t:24,b:48},showlegend:false,dragmode:'pan',hovermode:'closest',hoverdistance:14,
        paper_bgcolor:t.bg,plot_bgcolor:t.bg,font:{color:t.fg,family:getComputedStyle(document.body).fontFamily,size:12},hoverlabel:{bgcolor:t.bg,bordercolor:t.line,font:{color:t.fg}},
        xaxis:{...axis,title:axisTitle('UMAP 1'),range:ranges.x},yaxis:{...axis,title:axisTitle('UMAP 2'),range:ranges.y,scaleanchor:'x',scaleratio:1},uirevision:'fixed-atlas-v1'},
        {responsive:true,displayModeBar:false,displaylogo:false,scrollZoom:false,doubleClick:'reset'});
      map.dataset.comparisonId=state.comparisonId||'';map.dataset.visibleCount=String(shown.length);map.dataset.selectedId=selectedId||'';map.dataset.ready='true';
      map.setAttribute('aria-label',`${shown.length}音声の2次元地図。横軸UMAP 1、縦軸UMAP 2。点を選択して音声${selectionTarget}を変更します。録音条件で色を分けています。音声一覧からも選択できます。`);
    }while(completed!==requested);}catch(error){byId('app-error').hidden=false;byId('app-error').textContent='地図を表示できませんでした：'+error.message;}finally{rendering=false;}
  }
  function related(){
    const target=byId('related-list');target.replaceChildren();const index=indices.get(state.selectedId);
    byId('related-mode').disabled=index===undefined;
    document.querySelectorAll('[data-range]').forEach(button=>{button.disabled=index===undefined;button.setAttribute('aria-pressed',String(button.dataset.range===state.comparisonRange));});
    if(index===undefined){state.comparisonId=null;byId('related-caption').textContent='Aを選択すると、比較候補を表示します。';renderComparison();return;}
    const allowed=new Set(visible()),order=(state.relatedMode==='feature'?data.featureOrder:data.mapOrder)[index].filter(i=>i!==index&&allowed.has(i));
    const candidates=(state.comparisonRange==='far'?[...order].reverse():order).slice(0,3),t=palette();
    if(!allowed.has(indices.get(state.comparisonId))||state.comparisonId===state.selectedId)state.comparisonId=candidates.length?data.points[candidates[0]].id:null;
    byId('related-caption').textContent=(state.relatedMode==='feature'?'元のメル特徴':'2Dの地図')+'で、Aから'+(state.comparisonRange==='far'?'遠い':'近い')+'順に最大3件。現在の絞り込みの中から選びます。'+(state.comparisonId&&!candidates.some(i=>data.points[i].id===state.comparisonId)?' Bは現在の候補以外の音声です。':'');
    if(!candidates.length){const message=document.createElement('p');message.className='muted small';message.textContent='比較できる別の音声がありません。絞り込みを広げてください。';target.append(message);}
    candidates.forEach(i=>{
      const p=data.points[i],button=document.createElement('button');button.type='button';button.className='related-clip';button.dataset.id=p.id;
      button.setAttribute('aria-pressed',String(p.id===state.comparisonId));button.setAttribute('aria-label',`${p.cat}、${names[p.context]}、音声${clipNumbers[i]}、${p.duration.toFixed(2)}秒をBに設定`);
      const main=document.createElement('span');main.className='related-main';const cat=document.createElement('strong');cat.textContent=p.cat;const identity=document.createElement('small');identity.textContent=data.catProfiles?.[p.cat]?.breed||'';main.append(cat,identity);
      const meta=document.createElement('span');meta.className='related-meta';const dot=document.createElement('span');dot.className='related-dot';dot.textContent='●';dot.style.color=t[p.context];dot.setAttribute('aria-hidden','true');meta.append(dot,document.createTextNode(names[p.context]+' '+clipNumbers[i]));
      const duration=document.createElement('span');duration.className='related-time';duration.textContent=p.duration.toFixed(2)+'秒';button.append(main,meta,duration);
      button.addEventListener('click',()=>selectComparison(p.id));target.append(button);
    });
    save();renderComparison();renderClipOptions();
  }
  function renderComparison(){
    const index=indices.get(state.comparisonId),p=index===undefined?null:data.points[index];
    byId('comparison-content').hidden=!p;byId('comparison-empty').hidden=!!p;byId('comparison-error').hidden=true;
    if(!p){byId('comparison-empty').querySelector('p').textContent=state.selectedId?'比較できる別の音声がありません。猫や録音条件の絞り込みを広げてください。':'Aを選ぶと、距離が近い音声を表示します。地図の選択先をBに切り替えるか、下の候補から変更できます。';if(comparisonAssetId!==null){comparisonAudio.pause();comparisonAudio.removeAttribute('src');comparisonAudio.load();comparisonImageToken++;comparisonAssetId=null;comparisonImage=null;comparisonCanvas.dataset.id='';}return;}
    byId('comparison-cat').textContent=p.cat;byId('comparison-profile').textContent=profile(p.cat);byId('comparison-context').textContent='● '+names[p.context]+' '+clipNumbers[index];byId('comparison-context').style.color=palette()[p.context];
    byId('comparison-id').textContent=p.id;byId('comparison-session').textContent=String(p.session);byId('comparison-duration').textContent=p.duration.toFixed(2)+' 秒';byId('comparison-original-duration').textContent=p.originalDuration.toFixed(2)+' 秒';
    renderCatPhoto('comparison',p.cat);comparisonAudio.setAttribute('aria-label',`音声B、${catLabel(p.cat)}、${names[p.context]}を再生`);
    comparisonCanvas.setAttribute('aria-label',`${p.id}のメルスペクトログラム。横軸0〜${data.maxTime}秒、縦軸0〜4 kHz。`);
    if(comparisonAssetId!==p.id){
      comparisonAudio.pause();comparisonImage=null;comparisonCanvas.dataset.id='';comparisonCanvas.getContext('2d').clearRect(0,0,comparisonCanvas.width,comparisonCanvas.height);const ticket=++comparisonImageToken;comparisonAssetId=p.id;
      byId('comparison-status').textContent='音声を準備中';comparisonAudio.src=p.audio;comparisonAudio.load();
      const next=new Image();next.onload=()=>{if(ticket!==comparisonImageToken)return;comparisonImage=next;drawComparisonSpectrum();};next.onerror=()=>{if(ticket!==comparisonImageToken)return;byId('comparison-error').hidden=false;byId('comparison-error').textContent='スペクトログラムを読み込めませんでした。';};next.src=p.spectrum;
    }else drawComparisonSpectrum();
  }
  function hzToMel(hz){return hz<1000?hz/(200/3):15+Math.log(hz/1000)/(Math.log(6.4)/27);}
  function drawSpectrum(){if(image&&assetId===state.selectedId)paintSpectrum(canvas,image,data.points[indices.get(assetId)],audio);}
  function drawComparisonSpectrum(){if(comparisonImage&&comparisonAssetId===state.comparisonId)paintSpectrum(comparisonCanvas,comparisonImage,data.points[indices.get(comparisonAssetId)],comparisonAudio);}
  function paintSpectrum(canvas,image,p,audio){
    if(!p)return;
    const width=canvas.clientWidth,height=canvas.clientHeight,dpr=window.devicePixelRatio||1,t=palette();if(!width)return;
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
    const left=30,top=13,w=width-left-8,h=height-top-30;ctx.fillStyle=t.bg;ctx.fillRect(0,0,width,height);ctx.fillStyle='#000004';ctx.fillRect(left,top,w,h);
    ctx.imageSmoothingEnabled=false;ctx.drawImage(image,left,top,Math.min(w,p.frames*data.hopSeconds/data.maxTime*w),h);
    ctx.fillStyle=t.muted;ctx.font='11px -apple-system, sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
    [500,1000,2000,4000].forEach(hz=>ctx.fillText(String(hz/1000),left-5,top+h-hzToMel(hz)/hzToMel(4000)*h));
    ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('kHz',0,9);
    ctx.textAlign='center';[0,1,2,3].filter(v=>v<=data.maxTime).forEach(s=>ctx.fillText(String(s),left+s/data.maxTime*w,top+h+17));ctx.textAlign='right';ctx.fillText('秒',width-2,top+h+17);
    if(audio.currentTime>0){const x=left+Math.min(p.duration,audio.currentTime)/data.maxTime*w;ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,top+h);ctx.stroke();}
    canvas.dataset.id=p.id;
  }
  function stopAnimation(){cancelAnimationFrame(animation);animation=0;}
  function animate(){drawSpectrum();if(!audio.paused&&!audio.ended)animation=requestAnimationFrame(animate);}
  function renderDetails(){
    syncSelectionTarget();const index=indices.get(state.selectedId),p=index===undefined?null:data.points[index];byId('detail-empty').hidden=!!p;byId('detail-content').hidden=!p;byId('detail-error').hidden=true;
    const experienceURL='index.html'+(p?'?clip='+encodeURIComponent(p.id):'');byId('experience-link').href=experienceURL;document.querySelector('.brand').href=experienceURL;
    try{const url=new URL(location.href);if(url.searchParams.has('clip')){p?url.searchParams.set('clip',p.id):url.searchParams.delete('clip');history.replaceState(null,'',url);}}catch(_){}
    if(!p){related();byId('playing-indicator').hidden=true;if(assetId!==null){audio.pause();audio.removeAttribute('src');audio.load();stopAnimation();imageToken++;image=null;assetId=null;}return;}
    byId('selected-cat').textContent=p.cat;byId('selected-id').textContent=p.id;byId('selected-context').textContent='● '+names[p.context]+' '+clipNumbers[index];byId('selected-context').style.color=palette()[p.context];
    byId('selected-profile').textContent=profile(p.cat);
    renderCatPhoto('selected',p.cat);
    byId('selected-original-duration').textContent=p.originalDuration.toFixed(2)+' 秒';byId('selected-duration').textContent=p.duration.toFixed(2)+' 秒';byId('selected-session').textContent=String(p.session);
    audio.setAttribute('aria-label',`${catLabel(p.cat)}、${names[p.context]}の音声を再生`);canvas.setAttribute('aria-label',`${p.id}のメルスペクトログラム。横軸0〜${data.maxTime}秒、縦軸0〜4 kHz。`);
    if(assetId!==p.id){
      audio.pause();stopAnimation();byId('playing-indicator').hidden=true;image=null;canvas.dataset.id='';canvas.getContext('2d').clearRect(0,0,canvas.width,canvas.height);const ticket=++imageToken;assetId=p.id;
      byId('audio-status').textContent='音声を準備しています…';audio.src=p.audio;audio.load();
      const next=new Image();next.onload=()=>{if(ticket!==imageToken)return;image=next;drawSpectrum();};next.onerror=()=>{if(ticket!==imageToken)return;byId('detail-error').hidden=false;byId('detail-error').textContent='スペクトログラムを読み込めませんでした。';};next.src=p.spectrum;
    }else drawSpectrum();
    related();
  }
  function select(id){if(id!==null&&(!indices.has(id)||!visible().includes(indices.get(id))))return;if(id!==state.selectedId){comparisonAudio.pause();if(state.comparisonId===id)state.comparisonId=null;}state.selectedId=id;save();if(id&&!Array.from(byId('clip-select').options).some(option=>option.value===id))byId('clip-search').value='';renderClipOptions();byId('clip-select').value=id||'';renderDetails();renderMap();byId('app-status').textContent=id?`${data.points[indices.get(id)].cat}の音声を選択しました。再生ボタンで聴けます。`:'音声の選択を解除しました。';}
  function syncSelectionTarget(){
    if(!state.selectedId)selectionTarget='A';
    document.querySelectorAll('[data-select-target]').forEach(button=>{
      const active=button.dataset.selectTarget===selectionTarget;
      button.disabled=button.dataset.selectTarget==='B'&&!state.selectedId;
      button.setAttribute('aria-pressed',String(active));
      button.querySelector('.target-state').textContent=active?'✓ 選択中':button.disabled?'まずAを選択':'切り替える';
    });
    byId('selection-target-instruction').textContent=`地図の点を選ぶと、${selectionTarget}に設定されます。`;
    document.querySelector('.detail-panel').classList.toggle('is-selection-target',selectionTarget==='A');
    document.querySelector('.comparison-panel').classList.toggle('is-selection-target',selectionTarget==='B');
    byId('map-selection-hint').textContent=state.selectedId?`点を選ぶと${selectionTarget}を変更 · ドラッグで移動`:'まずAの点を選択してください。';
    byId('clip-browser-label').textContent=`音声一覧から${selectionTarget}を選ぶ`;byId('clip-select-label').textContent=`音声${selectionTarget}を選ぶ`;
    map.setAttribute('aria-label',`${visible().length}音声の2次元地図。横軸UMAP 1、縦軸UMAP 2。点を選択して音声${selectionTarget}を変更します。録音条件で色分けしています。`);
  }
  function selectComparison(id){
    if(!state.selectedId||!indices.has(id)||!visible().includes(indices.get(id))){renderClipOptions();return;}
    if(id===state.selectedId){byId('map-selection-hint').textContent='Bには、Aとは別の点を選んでください。';renderClipOptions();return;}
    state.comparisonId=id;
    if(!Array.from(byId('clip-select').options).some(option=>option.value===id))byId('clip-search').value='';
    related();syncSelectionTarget();renderMap();byId('app-status').textContent=`${data.points[indices.get(id)].cat}の音声をBに設定しました。`;
  }
  function selectForTarget(id){if(selectionTarget==='B')selectComparison(id);else select(id);}
  document.querySelectorAll('[data-select-target]').forEach(button=>button.addEventListener('click',()=>{selectionTarget=button.dataset.selectTarget;syncSelectionTarget();renderClipOptions();}));
  function filtersChanged(){if(state.cat!=='all'&&!matchesCategory(state.cat))state.cat='all';if(!visible().some(i=>data.points[i].id===state.selectedId))state.selectedId=null;save();renderControls();renderDetails();renderMap();}
  byId('clip-search').addEventListener('input',renderClipOptions);
  Object.keys(categoryValues).forEach(key=>byId(key+'-filter').addEventListener('change',event=>{state[key]=event.target.value;filtersChanged();}));
  byId('cat-filter').addEventListener('change',event=>{state.cat=event.target.value;filtersChanged();});
  document.querySelectorAll('.context-filter input').forEach(input=>input.addEventListener('change',()=>{state.contexts=contexts.filter(c=>document.querySelector(`.context-filter input[value="${c}"]`).checked);filtersChanged();}));
  byId('clip-select').addEventListener('change',event=>selectForTarget(event.target.value||null));
  byId('back-to-map').addEventListener('click',()=>byId('map-title').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
  byId('to-comparison-candidates').addEventListener('click',()=>byId('related-title').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
  function resetFilters(){state.breed=state.sex=state.neuter=state.cat='all';state.contexts=[...contexts];byId('clip-search').value='';filtersChanged();}
  byId('clear-filters').addEventListener('click',resetFilters);
  byId('reset-filters').addEventListener('click',resetFilters);
  byId('choose-first').addEventListener('click',()=>{const shown=visible();if(shown.length)select(data.points[shown[0]].id);});
  byId('related-mode').addEventListener('change',event=>{state.relatedMode=event.target.value==='map'?'map':'feature';state.comparisonId=null;related();renderMap();});
  document.querySelectorAll('[data-range]').forEach(button=>button.addEventListener('click',()=>{state.comparisonRange=button.dataset.range;state.comparisonId=null;related();renderMap();}));
  byId('reset-view').addEventListener('click',()=>Plotly.relayout(map,{'xaxis.range':[...data.bounds.x],'yaxis.range':[...data.bounds.y]}));
  function zoom(factor){if(!map._fullLayout)return;const changes={};for(const axis of ['xaxis','yaxis']){const [a,b]=map._fullLayout[axis].range,center=(a+b)/2,radius=(b-a)/2*factor;changes[axis+'.range']=[center-radius,center+radius];}Plotly.relayout(map,changes);}
  byId('zoom-in').addEventListener('click',()=>zoom(.75));byId('zoom-out').addEventListener('click',()=>zoom(4/3));
  function syncPlayback(){const active=!!state.selectedId&&!audio.paused&&!audio.ended;byId('playing-indicator').hidden=!active;stopAnimation();if(active){byId('audio-status').textContent='再生しています';animate();}else{drawSpectrum();if(state.selectedId)byId('audio-status').textContent=audio.ended?'再生終了':audio.readyState>=1?'再生ボタンで再生':'音声を準備しています…';}}
  ['loadedmetadata','play','pause','ended'].forEach(event=>audio.addEventListener(event,syncPlayback));
  audio.addEventListener('seeked',drawSpectrum);
  window.addEventListener('pagehide',()=>{audio.pause();comparisonAudio.pause();stopAnimation();cancelAnimationFrame(comparisonAnimation);});
  audio.addEventListener('error',()=>{if(state.selectedId){byId('detail-error').hidden=false;byId('detail-error').textContent='音声を読み込めませんでした。別の点を選ぶか、画面を開き直してください。';byId('audio-status').textContent='音声の読み込みに失敗しました';}});
  function syncComparisonPlayback(){
    cancelAnimationFrame(comparisonAnimation);if(!state.comparisonId)return;
    const playing=!comparisonAudio.paused&&!comparisonAudio.ended;
    byId('comparison-status').textContent=playing?'再生中':comparisonAudio.ended?'再生終了':comparisonAudio.readyState>=1?'再生ボタンで再生':'音声を準備中';
    drawComparisonSpectrum();if(playing)comparisonAnimation=requestAnimationFrame(animateComparison);
  }
  function animateComparison(){drawComparisonSpectrum();if(!comparisonAudio.paused&&!comparisonAudio.ended)comparisonAnimation=requestAnimationFrame(animateComparison);}
  audio.addEventListener('play',()=>comparisonAudio.pause());
  comparisonAudio.addEventListener('play',()=>audio.pause());
  ['loadedmetadata','play','pause','ended','seeked'].forEach(event=>comparisonAudio.addEventListener(event,syncComparisonPlayback));
  comparisonAudio.addEventListener('error',()=>{if(!state.comparisonId)return;byId('comparison-error').hidden=false;byId('comparison-error').textContent='音声を読み込めませんでした。別の比較候補を選んでください。';});
  const resize=new ResizeObserver(()=>{if(map.data)Plotly.Plots.resize(map);drawSpectrum();drawComparisonSpectrum();});resize.observe(map);resize.observe(canvas);resize.observe(comparisonCanvas);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{renderMap();renderDetails();});
  renderControls();renderDetails();renderMap().then(()=>{map.on('plotly_click',event=>{const point=event.points.find(p=>Number.isInteger(p.customdata));if(point)selectForTarget(data.points[point.customdata].id);});});
})();
