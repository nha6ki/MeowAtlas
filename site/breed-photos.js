(() => {
  'use strict';
  function link(text,href){const a=document.createElement('a');a.textContent=text;a.href=href;a.target='_blank';a.rel='noopener noreferrer';return a;}
  function attribution(photo){
    const line=document.createElement('p');line.className='breed-attribution';line.title=photo.title+' — '+photo.changes;
    line.append(link('写真：'+photo.author,photo.sourceUrl),' · ',link(photo.license,photo.licenseUrl));
    const modifications=document.createElement('span');modifications.className='breed-changes';modifications.textContent='（'+photo.displayNote+'）';line.append(modifications);return line;
  }
  window.renderCatPhoto=(prefix,catId)=>{
    const figure=document.getElementById(prefix+'-breed-photo'),credit=document.getElementById(prefix+'-breed-credit'),photo=window.MEOW_ATLAS.catImages?.[catId],immersive=prefix==='voice';
    if(!photo){figure.hidden=true;figure.replaceChildren();delete figure.dataset.cat;delete figure.dataset.loaded;if(credit){credit.hidden=true;credit.replaceChildren();}return;}
    if(figure.dataset.cat===catId)return;
    figure.dataset.cat=catId;figure.dataset.breed=photo.breedCode;figure.hidden=false;figure.replaceChildren();
    if(credit){credit.hidden=false;credit.replaceChildren();}
    const picture=immersive?document.createElement('div'):link('',photo.sourceUrl);picture.className='breed-picture';
    if(!immersive)picture.setAttribute('aria-label',catId+'のイメージ写真の出典を開く');
    const img=new Image();img.alt=photo.alt;img.width=photo.width;img.height=photo.height;img.decoding='async';img.hidden=true;img.style.objectPosition=photo.objectPosition;
    const fallback=document.createElement('span');fallback.className='breed-image-status';fallback.textContent='写真を読み込み中';
    // Replacing the element prevents an earlier request from painting over a new cat.
    img.onload=()=>{if(figure.querySelector('img')!==img)return;img.hidden=false;fallback.hidden=true;figure.dataset.loaded=catId;};
    img.onerror=()=>{if(figure.querySelector('img')!==img)return;fallback.textContent='写真を読み込めません';delete figure.dataset.loaded;};
    delete figure.dataset.loaded;picture.append(img,fallback);figure.append(picture);img.src=photo.src;
    if(!immersive){const caption=document.createElement('figcaption');caption.textContent='個体識別用のイメージ写真';figure.append(caption);}
    if(credit){const note=document.createElement('p');note.className='breed-reference-note';note.textContent='写真は録音された猫とは別個体です。';credit.append(note,attribution(photo));}
  };
  window.renderPhotoCredits=targetId=>{
    const target=document.getElementById(targetId);if(target.dataset.ready)return;
    for(const [cat,photo] of Object.entries(window.MEOW_ATLAS.catImages).sort(([a],[b])=>a.localeCompare(b))){
      const row=document.createElement('div');row.className='photo-credit-entry';row.dataset.cat=cat;
      const heading=document.createElement('h4');heading.textContent=cat+' · '+photo.breed;
      const source=document.createElement('p');source.append(link(photo.title,photo.sourceUrl));
      const changes=document.createElement('p');changes.className='photo-changes';changes.textContent=photo.changes;
      row.append(heading,source,attribution(photo),changes);target.append(row);
    }
    target.dataset.ready='true';
  };
})();
