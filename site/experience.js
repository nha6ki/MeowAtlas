(() => {
  'use strict';
  const data=window.MEOW_ATLAS,get=id=>document.getElementById(id),plot=get('experience-map'),audio=get('experience-audio'),card=get('voice-card');
  if(!data||!window.Plotly){get('experience-error').hidden=false;get('experience-error').textContent='地図を読み込めませんでした。画面を開き直してください。';return;}
  const names={B:'ブラッシング',F:'食事待ち',I:'隔離'},theme=getComputedStyle(document.documentElement);
  const colors=Object.fromEntries([['B','--brush'],['F','--food'],['I','--isolation']].map(([context,token])=>[context,theme.getPropertyValue(token).trim()]));
  const indices=new Map(data.points.map((p,i)=>[p.id,i])),compact=matchMedia('(max-width:700px)');
  const profile=cat=>data.catProfiles?.[cat]?.description||'',catLabel=cat=>[cat,profile(cat)].filter(Boolean).join(' · ');
  let selected=null,request=0,rendering=false,playTicket=0,frame=0;
  const incoming=new URLSearchParams(location.search).get('clip');
  function linkToAnalysis(){const id=selected===null?null:data.points[selected].id,href='analysis.html'+(id?'?clip='+encodeURIComponent(id):'');['analysis-link','about-analysis'].forEach(key=>get(key).href=href);try{const url=new URL(location.href);if(url.searchParams.has('clip')){id?url.searchParams.set('clip',id):url.searchParams.delete('clip');history.replaceState(null,'',url);}}catch(_){}}
  async function draw(){request++;if(rendering)return;rendering=true;try{let completed;do{
    completed=request;const current=selected,xy=data.points.map(p=>p.coordinates);
    // Redrawing a selection must retain the current zoom and pan, without changing saved coordinates.
    const ranges={x:[...(plot._fullLayout?.xaxis.range||data.bounds.x)],y:[...(plot._fullLayout?.yaxis.range||data.bounds.y)]};
    const traces=[{type:'scatter',mode:'markers',x:xy.map(p=>p[0]),y:xy.map(p=>p[1]),hoverinfo:'skip',showlegend:false,marker:{size:compact.matches?8:12,opacity:.055,color:data.points.map(p=>colors[p.context]),line:{width:0}}},
      {type:'scatter',mode:'markers',x:xy.map(p=>p[0]),y:xy.map(p=>p[1]),ids:data.points.map(p=>p.id),customdata:data.points.map((_,i)=>i),hoverinfo:'none',showlegend:false,
       marker:{size:compact.matches?4.5:5.5,opacity:.9,color:data.points.map(p=>colors[p.context]),symbol:'circle',line:{width:.5,color:'rgba(255,255,255,.16)'}}},
      {type:'scatter',mode:'markers',x:current===null?[]:[xy[current][0]],y:current===null?[]:[xy[current][1]],customdata:current===null?[]:[current],hoverinfo:'skip',showlegend:false,marker:{size:compact.matches?17:19,symbol:'circle-open',opacity:.9,color:current===null?'#fff':colors[data.points[current].context],line:{width:1}}}];
    const axis={visible:false,showgrid:false,zeroline:false,autorange:false,fixedrange:false,constrain:'domain'};
    await Plotly.react(plot,traces,{autosize:true,height:plot.clientHeight,margin:{l:30,r:30,t:30,b:65},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',showlegend:false,dragmode:'pan',hovermode:'closest',hoverdistance:14,
      xaxis:{...axis,range:ranges.x},yaxis:{...axis,range:ranges.y,scaleanchor:'x',scaleratio:1},uirevision:'experience-fixed-map'},
      {responsive:true,displayModeBar:false,displaylogo:false,scrollZoom:true,doubleClick:false});
    plot.dataset.ready='true';plot.dataset.selectedId=current===null?'':data.points[current].id;
    document.querySelectorAll('.experience-map-controls button').forEach(button=>button.disabled=false);
  }while(completed!==request);}catch(error){get('experience-error').hidden=false;get('experience-error').textContent='地図を表示できませんでした：'+error.message;}finally{rendering=false;}}
  function zoomMap(factor){
    if(!plot._fullLayout)return;
    const changes={};
    for(const axis of ['xaxis','yaxis']){const [a,b]=plot._fullLayout[axis].range,center=(a+b)/2,radius=(b-a)/2*factor;changes[axis+'.range']=[center-radius,center+radius];}
    Plotly.relayout(plot,changes);
  }
  get('experience-zoom-in').addEventListener('click',()=>zoomMap(.75));
  get('experience-zoom-out').addEventListener('click',()=>zoomMap(4/3));
  get('experience-reset-view').addEventListener('click',()=>Plotly.relayout(plot,{'xaxis.range':[...data.bounds.x],'yaxis.range':[...data.bounds.y]}));
  function updateTime(){if(selected===null)return;const p=data.points[selected],time=Math.max(0,Math.min(audio.currentTime||0,p.duration));get('voice-elapsed').textContent=time.toFixed(2);get('voice-seek').value=String(time);get('voice-seek').style.setProperty('--progress',(100*time/p.duration)+'%');}
  function tick(){updateTime();if(!audio.paused&&!audio.ended)frame=requestAnimationFrame(tick);}
  function syncPlayback(){cancelAnimationFrame(frame);const playing=selected!==null&&!audio.paused&&!audio.ended;document.body.classList.toggle('is-playing',playing);get('play-voice').setAttribute('aria-label',playing?'音声を一時停止':'音声を再生');get('play-icon').setAttribute('d',playing?'M7 5h4v14H7ZM14 5h4v14h-4Z':'M8 5v14l11-7Z');if(selected!==null){get('voice-status').textContent=playing?'再生中':audio.ended?'':audio.readyState>=1?'再生ボタンで聴く':'音声を準備中';}updateTime();if(playing)tick();}
  function play(){const ticket=++playTicket;get('voice-error').hidden=true;try{const attempt=audio.play();attempt?.catch(error=>{if(ticket!==playTicket||selected===null||error.name==='AbortError')return;syncPlayback();if(error.name==='NotAllowedError'){get('voice-status').textContent='再生ボタンを押して聴く';}else{get('voice-error').hidden=false;get('voice-error').textContent='音声を再生できませんでした。再生ボタンでもう一度お試しください。';}});}catch(_){get('voice-error').hidden=false;get('voice-error').textContent='音声を再生できませんでした。';}}
  function choose(index,autoplay=true){
    if(!Number.isInteger(index)||index<0||index>=data.points.length)return;
    const p=data.points[index];playTicket++;audio.pause();selected=index;get('voice-error').hidden=true;
    card.hidden=false;document.body.classList.add('has-selection');get('invitation').setAttribute('aria-hidden','true');
    get('voice-title').textContent=p.cat;get('voice-context').textContent='● '+names[p.context];
    get('voice-profile').textContent=profile(p.cat);
    renderCatPhoto('voice',p.cat);
    get('voice-total').textContent=p.duration.toFixed(2);get('voice-seek').max=String(p.duration);get('voice-seek').value='0';get('voice-elapsed').textContent='0.00';get('voice-seek').style.setProperty('--progress','0%');
    document.documentElement.style.setProperty('--voice',colors[p.context]);card.dataset.id=p.id;audio.setAttribute('aria-label',`${catLabel(p.cat)}、${names[p.context]}の鳴き声`);
    audio.src=p.audio;audio.load();linkToAnalysis();syncPlayback();draw();
    get('experience-announcement').textContent=`${catLabel(p.cat)}、${names[p.context]}、${p.duration.toFixed(2)}秒の鳴き声。`;
    // Invoke play within the original click/tap gesture; never autoplay on hover or navigation.
    if(autoplay)play();
  }
  function closeVoice(){playTicket++;audio.pause();selected=null;audio.removeAttribute('src');audio.load();cancelAnimationFrame(frame);card.hidden=true;card.dataset.id='';document.body.classList.remove('has-selection','is-playing');get('invitation').removeAttribute('aria-hidden');linkToAnalysis();draw();get('experience-announcement').textContent='音声を閉じました。地図から別の声を選べます。';}
  get('close-voice').addEventListener('click',closeVoice);
  get('play-voice').addEventListener('click',()=>{if(selected===null)return;if(audio.paused||audio.ended){if(audio.ended)audio.currentTime=0;play();}else{playTicket++;audio.pause();}});
  get('voice-seek').addEventListener('input',()=>{if(selected!==null&&audio.readyState>=1){audio.currentTime=Math.min(Number(get('voice-seek').value),data.points[selected].duration);updateTime();}});
  ['loadedmetadata','play','pause','ended','seeked'].forEach(event=>audio.addEventListener(event,syncPlayback));
  audio.addEventListener('error',()=>{if(selected===null)return;syncPlayback();get('voice-error').hidden=false;get('voice-error').textContent='音声を読み込めませんでした。別の点を選ぶか、画面を開き直してください。';});
  get('open-about').addEventListener('click',()=>{renderPhotoCredits('photo-credits-list');get('about-dialog').showModal();});
  document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>get(button.dataset.close).close()));
  for(const id of ['about-dialog','picker-dialog'])get(id).addEventListener('click',event=>{if(event.target===get(id)){const b=get(id).getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)get(id).close();}});
  const pickerCats=[...new Set(data.points.map(p=>p.cat))].sort(),clipCounts=new Map();
  const normalize=value=>value.normalize('NFKC').toLocaleLowerCase().trim();
  // Stable display numbers within each cat and context; filtering never renumbers clips.
  const pickerRecords=data.points.map((p,index)=>{
    const key=p.cat+':'+p.context,number=(clipCounts.get(key)||0)+1;clipCounts.set(key,number);
    return {point:p,index,number:String(number).padStart(2,'0'),search:normalize(`${catLabel(p.cat)} ${p.id} ${names[p.context]}`)};
  });
  let pickerContext='all';
  pickerCats.forEach(cat=>{const option=document.createElement('option');option.value=cat;option.textContent=catLabel(cat);get('picker-cat').append(option);});
  function populatePicker(){
    const cat=get('picker-cat').value,query=normalize(get('picker-search').value),terms=query.split(/\s+/).filter(Boolean);
    const shown=pickerRecords.filter(({point:p,search})=>(cat==='all'||p.cat===cat)&&(pickerContext==='all'||p.context===pickerContext)&&terms.every(term=>search.includes(term)));
    const fragment=document.createDocumentFragment();
    pickerCats.forEach(cat=>{
      const records=shown.filter(({point:p})=>p.cat===cat);if(!records.length)return;
      const group=document.createElement('section');group.className='picker-group';group.setAttribute('aria-labelledby','picker-cat-'+cat);
      const heading=document.createElement('div');heading.className='picker-group-heading';
      const title=document.createElement('h3');title.id='picker-cat-'+cat;title.textContent=cat;
      const identity=document.createElement('span');identity.textContent=profile(cat);title.append(identity);
      const count=document.createElement('span');count.className='picker-group-count';count.textContent=records.length+'件';heading.append(title,count);
      const list=document.createElement('ul');list.className='picker-clips';
      records.forEach(({point:p,index,number})=>{
        const item=document.createElement('li'),button=document.createElement('button');button.type='button';button.className='picker-row';button.dataset.index=String(index);button.style.setProperty('--row-color',colors[p.context]);
        button.setAttribute('aria-label',`${catLabel(p.cat)}、${names[p.context]}、音声${number}、${p.duration.toFixed(2)}秒を再生`);button.title=p.id;
        if(index===selected)button.setAttribute('aria-current','true');
        const context=document.createElement('span');context.className='picker-row-context';
        const dot=document.createElement('span');dot.className='picker-row-dot';dot.setAttribute('aria-hidden','true');context.append(dot,document.createTextNode(names[p.context]));
        const ordinal=document.createElement('span');ordinal.className='picker-row-number';ordinal.textContent=number;ordinal.setAttribute('aria-hidden','true');
        const duration=document.createElement('span');duration.className='picker-row-duration';duration.textContent=p.duration.toFixed(2)+'秒';
        const playIcon=document.createElement('span');playIcon.className='picker-row-play';playIcon.setAttribute('aria-hidden','true');
        button.append(context,ordinal,duration,playIcon);item.append(button);list.append(item);
      });
      group.append(heading,list);fragment.append(group);
    });
    get('picker-list').replaceChildren(fragment);get('picker-results').scrollTop=0;
    get('picker-count').textContent=`${shown.length}件 · ${new Set(shown.map(({point:p})=>p.cat)).size}匹`;
    get('picker-empty').hidden=!!shown.length;get('picker-reset').hidden=cat==='all'&&pickerContext==='all'&&!get('picker-search').value;
    get('picker-contexts').querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.context===pickerContext)));
  }
  get('open-picker').addEventListener('click',()=>{
    populatePicker();get('picker-dialog').showModal();get('picker-results').scrollTop=0;
    get('picker-list').querySelector('[aria-current="true"]')?.scrollIntoView({block:'center'});
  });
  get('picker-cat').addEventListener('change',populatePicker);
  get('picker-search').addEventListener('input',populatePicker);
  get('picker-contexts').addEventListener('click',event=>{const button=event.target.closest('button[data-context]');if(!button)return;pickerContext=button.dataset.context;populatePicker();});
  get('picker-reset').addEventListener('click',()=>{get('picker-cat').value='all';get('picker-search').value='';pickerContext='all';populatePicker();get('picker-cat').focus();});
  get('picker-list').addEventListener('click',event=>{const button=event.target.closest('button[data-index]');if(!button)return;get('picker-dialog').close();choose(Number(button.dataset.index),true);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('dialog[open]')&&selected!==null){closeVoice();get('open-picker').focus();}});
  window.addEventListener('pagehide',()=>{playTicket++;audio.pause();cancelAnimationFrame(frame);});
  new ResizeObserver(()=>{if(plot.data)Plotly.Plots.resize(plot);}).observe(plot);
  compact.addEventListener('change',()=>{if(plot.data)draw();});
  if(!indices.has(incoming))linkToAnalysis();
  draw().then(()=>{plot.on('plotly_click',event=>{const point=event.points.find(p=>p.curveNumber!==0&&Number.isInteger(p.customdata));if(point)choose(point.customdata,true);});if(indices.has(incoming))choose(indices.get(incoming),false);});
})();
