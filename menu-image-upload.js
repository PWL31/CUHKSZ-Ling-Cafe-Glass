(function(){
  const VERSION=4;
  if((window.__lingMenuImageUploadVersion||0)>=VERSION) return;
  window.__lingMenuImageUploadVersion=VERSION;
  window.__lingMenuImageUploadInstalled=true;

  const MAX_SOURCE_BYTES=30*1024*1024;
  const TARGET_BYTES=650*1024;
  const OUTPUT_WIDTHS=[960,840,720,640];
  const JPEG_QUALITIES=[.82,.74,.66,.58,.50,.42];
  const ALLOWED_TYPES=new Set(['image/jpeg','image/png','image/webp']);

  function toastMessage(message){
    if(typeof window.toast==='function') window.toast(message);
  }

  function fourThree(width,height){
    return width>0&&height>0&&Math.abs((width/height)-(4/3))<=0.015;
  }

  function loadImage(file){
    return new Promise((resolve,reject)=>{
      const url=URL.createObjectURL(file);
      const image=new Image();
      image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};
      image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read this image.'))};
      image.src=url;
    });
  }

  function canvasBlob(canvas,type,quality){
    return new Promise(resolve=>canvas.toBlob(resolve,type,quality));
  }

  function renderCanvas(image,width){
    const targetWidth=Math.max(1,Math.round(width));
    const targetHeight=Math.max(1,Math.round(targetWidth*3/4));
    const canvas=document.createElement('canvas');
    canvas.width=targetWidth;
    canvas.height=targetHeight;
    const context=canvas.getContext('2d',{alpha:false});
    if(!context) throw new Error('Image processing is unavailable in this browser.');
    context.fillStyle='#ffffff';
    context.fillRect(0,0,targetWidth,targetHeight);
    context.imageSmoothingEnabled=true;
    context.imageSmoothingQuality='high';
    context.drawImage(image,0,0,targetWidth,targetHeight);
    return canvas;
  }

  async function prepareFourThreeImage(file){
    if(!ALLOWED_TYPES.has(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.');
    if(file.size>MAX_SOURCE_BYTES) throw new Error('Choose an image smaller than 30 MB.');

    const image=await loadImage(file);
    const sourceWidth=image.naturalWidth||image.width;
    const sourceHeight=image.naturalHeight||image.height;
    if(!fourThree(sourceWidth,sourceHeight)){
      throw new Error(`Image must be 4:3. Selected image is ${sourceWidth}×${sourceHeight}.`);
    }

    const widths=[Math.min(sourceWidth,960),...OUTPUT_WIDTHS]
      .filter(width=>width>0&&width<=sourceWidth)
      .filter((width,index,array)=>array.indexOf(width)===index)
      .sort((a,b)=>b-a);

    let smallest=null;
    for(const width of widths){
      const canvas=renderCanvas(image,width);
      for(const quality of JPEG_QUALITIES){
        const blob=await canvasBlob(canvas,'image/jpeg',quality);
        if(!blob) continue;
        if(!smallest||blob.size<smallest.blob.size){
          smallest={blob,width:canvas.width,height:canvas.height};
        }
        if(blob.size<=TARGET_BYTES){
          return {blob,width:canvas.width,height:canvas.height};
        }
      }
    }

    if(smallest&&smallest.blob.size<1_200_000) return smallest;
    throw new Error('Could not optimize this image on this device. Please try the same image again after refreshing the page.');
  }

  async function uploadImage(id,file,row){
    const status=row.querySelector('[data-menu-image-status]');
    const button=row.querySelector('[data-menu-image-button]');
    const input=row.querySelector('[data-menu-image-input]');
    if(status) status.textContent='Optimizing image…';
    if(button) button.classList.add('is-busy');

    try{
      const prepared=await prepareFourThreeImage(file);
      const sizeKb=Math.max(1,Math.round(prepared.blob.size/1024));
      if(status) status.textContent=`Uploading ${prepared.width}×${prepared.height} · ${sizeKb} KB…`;

      const response=await fetch(`/api/admin/menu/${id}/image`,{
        method:'PUT',
        credentials:'same-origin',
        cache:'no-store',
        headers:{
          'Content-Type':'image/jpeg',
          'X-Image-Width':String(prepared.width),
          'X-Image-Height':String(prepared.height),
        },
        body:prepared.blob,
      });

      let body={};
      try{body=await response.json()}catch(_){}
      if(!response.ok){
        const detail=body.detail?` ${body.detail}`:'';
        throw new Error((body.error||`Upload failed (${response.status})`)+detail);
      }

      const imageUrl=body.item?.image;
      const preview=row.querySelector('.admin-menu-image');
      if(preview&&imageUrl) preview.style.backgroundImage=`url("${String(imageUrl).replace(/"/g,'%22')}")`;
      document.querySelectorAll(`.drink-card[data-menu-id="${id}"] .drink-image`).forEach(el=>{
        if(imageUrl) el.style.setProperty('background-image',`url("${String(imageUrl).replace(/"/g,'%22')}")`,'important');
      });
      if(status) status.textContent=`Uploaded · ${prepared.width}×${prepared.height} · ${sizeKb} KB`;
      toastMessage('Menu image updated');
      setTimeout(()=>location.reload(),700);
    }catch(error){
      const message=String(error?.message||error||'Image upload failed.');
      if(status) status.textContent=message;
      toastMessage(message);
    }finally{
      if(button) button.classList.remove('is-busy');
      if(input) input.value='';
    }
  }

  function enhanceRow(row){
    if(row.dataset.imageUploadVersion===String(VERSION)) return;
    const id=Number(row.dataset.adminItem);
    const media=row.firstElementChild;
    const preview=media?.querySelector('.admin-menu-image');
    if(!id||!media||!preview) return;

    row.dataset.imageUploadVersion=String(VERSION);
    const current=preview.style.backgroundImage||'';
    if(current.includes('menu-sprite')) preview.style.backgroundImage="url('/menu-placeholder.svg')";

    const oldUploader=media.querySelector('.admin-image-uploader');
    oldUploader?.remove();
    const oldLabel=media.querySelector('.admin-image-label');
    if(oldLabel) oldLabel.textContent='Menu image · 4:3';

    const uploader=document.createElement('div');
    uploader.className='admin-image-uploader';
    uploader.innerHTML=`
      <label class="admin-image-upload-button" data-menu-image-button>
        <input data-menu-image-input type="file" accept="image/jpeg,image/png,image/webp">
        <span>Choose 4:3 image</span>
      </label>
      <div class="admin-image-upload-help">JPG / PNG / WebP · exact 4:3 · originals up to 30 MB · automatically resized for upload</div>
      <div class="admin-image-upload-status" data-menu-image-status></div>`;
    media.appendChild(uploader);

    uploader.querySelector('[data-menu-image-input]')?.addEventListener('change',event=>{
      const file=event.target.files?.[0];
      if(file) uploadImage(id,file,row);
    });
  }

  function enhanceAddCard(){
    const card=document.querySelector('#adminMenuEditor .admin-add-card');
    if(!card) return;
    const workflow=card.querySelector('.admin-image-workflow');
    if(workflow){
      workflow.innerHTML='<strong>Image:</strong> Add the item first, then use <strong>Choose 4:3 image</strong>. You can select a 1536×1152 generated image directly; the browser will resize it automatically.';
    }
  }

  function updateScopeCopy(){
    const menuCard=[...document.querySelectorAll('.admin-scope-card')].find(card=>card.querySelector('strong')?.textContent.trim()==='Menu');
    const copy=menuCard?.querySelector('span');
    if(copy) copy.textContent='Full backend CRUD for menu items, including 4:3 image upload. Images update publicly after upload.';
  }

  function enhance(){
    document.querySelectorAll('#adminMenuEditor .admin-menu-item[data-admin-item]').forEach(enhanceRow);
    enhanceAddCard();
    updateScopeCopy();
  }

  if(!document.getElementById('ling-menu-image-upload-styles')){
    const style=document.createElement('style');
    style.id='ling-menu-image-upload-styles';
    style.textContent=`
      .drink-card .drink-image{height:auto!important;aspect-ratio:4/3!important;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}
      .compact-grid .drink-image{height:auto!important}
      #adminMenuEditor .admin-menu-item{display:grid!important;grid-template-columns:minmax(190px,240px) minmax(0,1fr)!important;gap:16px!important}
      #adminMenuEditor .admin-menu-item>div:first-child{display:block!important;min-width:0}
      #adminMenuEditor .admin-menu-image{width:100%!important;height:auto!important;aspect-ratio:4/3!important;border-radius:17px!important;background-size:cover!important;background-position:center!important}
      .admin-image-uploader{margin-top:10px}
      .admin-image-upload-button{margin:0!important;min-height:42px;border:1px solid var(--line);border-radius:999px;background:rgba(255,255,255,.10);display:flex!important;align-items:center;justify-content:center;padding:0 14px;color:var(--text-strong);font-weight:750;font-size:12px;cursor:pointer;transition:.2s}
      .admin-image-upload-button:hover{background:rgba(255,255,255,.16)}
      .admin-image-upload-button.is-busy{opacity:.55;pointer-events:none}
      .admin-image-upload-button input{position:absolute!important;opacity:0!important;width:1px!important;height:1px!important;pointer-events:none!important}
      .admin-image-upload-help,.admin-image-upload-status{font-size:10px;line-height:1.45;color:var(--muted);margin-top:7px}
      .admin-image-upload-status{min-height:14px}
      @media(max-width:760px),(orientation:portrait){
        #adminMenuEditor .admin-menu-item{grid-template-columns:1fr!important}
        #adminMenuEditor .admin-menu-image{width:100%!important;max-width:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  const observer=new MutationObserver(()=>enhance());
  function start(){
    observer.observe(document.body,{childList:true,subtree:true});
    enhance();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
