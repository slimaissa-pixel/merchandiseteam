import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MAP_DEFAULTS, WEB_MAP_STYLES } from '../config/mainMap';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

/* ── Global CSS (injected once) ─────────────────────────────────────────── */
const CSS = `
  @keyframes m-pulse { 0%{transform:scale(0.8);opacity:1} 70%{transform:scale(3);opacity:0} 100%{transform:scale(0.8);opacity:0} }
  @keyframes m-pulse2 { 0%{transform:scale(0.8);opacity:.6} 70%{transform:scale(2.2);opacity:0} 100%{transform:scale(0.8);opacity:0} }
  @keyframes m-breathe { 0%,100%{box-shadow:0 0 8px 3px rgba(6,182,212,.9),0 0 20px 6px rgba(6,182,212,.4)} 50%{box-shadow:0 0 14px 6px rgba(6,182,212,1),0 0 32px 12px rgba(6,182,212,.6)} }
  @keyframes m-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
  .m-user{position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:default}
  .m-user .r1{position:absolute;width:100%;height:100%;border-radius:50%;background:rgba(6,182,212,.35);animation:m-pulse 2.2s cubic-bezier(.4,0,.6,1) infinite}
  .m-user .r2{position:absolute;width:100%;height:100%;border-radius:50%;background:rgba(6,182,212,.2);animation:m-pulse2 2.2s cubic-bezier(.4,0,.6,1) .4s infinite}
  .m-user .dot{position:relative;z-index:2;width:13px;height:13px;border-radius:50%;background:#06b6d4;border:2.5px solid #fff;animation:m-breathe 2.5s ease-in-out infinite}
  .m-store{cursor:pointer}
  .m-store-inner{display:flex;flex-direction:column;align-items:center;animation:m-bounce 3s ease-in-out infinite}
  .m-store-inner .pin{width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,.6);box-shadow:0 4px 14px rgba(0,0,0,.5);transition:transform .2s ease}
  .m-store:hover .pin{transform:rotate(-45deg) scale(1.2)}
  .m-store-inner .pin i{transform:rotate(45deg);display:flex}
  .m-store-inner .lbl{margin-top:5px;background:rgba(10,15,25,.88);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12);padding:3px 9px;border-radius:20px;font:700 10px/1 'Inter',system-ui,sans-serif;color:#e2e8f0;white-space:nowrap;pointer-events:none;letter-spacing:.04em}
  .m-place{width:22px;height:22px;border-radius:50%;background:#f59e0b;border:3px solid #fff;box-shadow:0 0 0 4px rgba(245,158,11,.3);cursor:crosshair}
  .m-cluster{display:flex;align-items:center;justify-content:center;border-radius:50%;border:2px solid rgba(255,255,255,.4);cursor:pointer;transition:transform .15s ease;font:700 12px 'Inter',sans-serif;color:#fff}
  .m-cluster:hover{transform:scale(1.1)}
  .mpopup .maplibregl-popup-content{background:rgba(10,15,25,.92)!important;backdrop-filter:blur(14px)!important;border:1px solid rgba(255,255,255,.1)!important;border-radius:14px!important;padding:0!important;box-shadow:0 8px 32px rgba(0,0,0,.55)!important;color:#e2e8f0!important;font-family:'Inter',system-ui,sans-serif!important;min-width:200px}
  .mpopup .maplibregl-popup-tip{display:none!important}
  .map-ctrl{position:absolute;right:14px;top:14px;display:flex;flex-direction:column;gap:6px;z-index:10}
  .map-ctrl-btn{width:36px;height:36px;border-radius:10px;background:rgba(10,15,25,.85);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;cursor:pointer;color:#e2e8f0;font-size:16px;transition:all .15s ease;user-select:none}
  .map-ctrl-btn:hover{background:rgba(99,102,241,.6);border-color:rgba(99,102,241,.8)}
  .map-ctrl-btn.active{background:rgba(6,182,212,.4);border-color:#06b6d4;color:#06b6d4}
  .map-style-sel{position:absolute;left:14px;top:14px;z-index:10}
  .map-style-sel select{background:rgba(10,15,25,.88);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.12);color:#e2e8f0;padding:6px 10px;border-radius:10px;font:600 12px 'Inter',sans-serif;cursor:pointer;outline:none;appearance:none;padding-right:28px}
  .maplibregl-ctrl-attrib{display:none!important}
`;
function injectCSS(){if(typeof document==='undefined'||document.getElementById('m-css'))return;const s=document.createElement('style');s.id='m-css';s.textContent=CSS;document.head.appendChild(s);}

/* ── Style resolver ──────────────────────────────────────────────────────── */
const STYLES:{[k:string]:any}={
  'Default (Carto)': WEB_MAP_STYLES.voyager,
  'Dark Matter':     WEB_MAP_STYLES.darkMatter,
  'Satellite':       WEB_MAP_STYLES.satellite,
  'OpenStreetMap 3D':{ version:8, sources:{'osm':{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap'}}, layers:[{id:'osm',type:'raster',source:'osm'}] },
};
const DEFAULT_STYLE = 'Dark Matter';

/* ── Arc helpers ─────────────────────────────────────────────────────────── */
function greatCircleArc(from:[number,number], to:[number,number], steps=80):[number,number][]{
  const pts:[number,number][] = [];
  for(let i=0;i<=steps;i++){
    const t = i/steps;
    // simple spherical interpolation
    const lat = from[1]+(to[1]-from[1])*t;
    const lon = from[0]+(to[0]-from[0])*t;
    // add height curve
    const h = Math.sin(Math.PI*t)*0.5;
    pts.push([lon+h, lat+h*0.3]);
  }
  return pts;
}

/* ══════════════════════════════════════════════════════════════════════════
   AppMapView – the main component
══════════════════════════════════════════════════════════════════════════ */
const AppMapView = forwardRef(function AppMapView({
  style, initialRegion, children,
  onRegionChangeComplete,
  scrollEnabled=true, zoomEnabled=true, dragging=true,
  mapType='darkMatter',
  showStyleSelector=false,
  showControls=true,
  clusters=false,
  onMapPress,
  routes=[],
  arcs=[],
  showPlacePicker=false,
  autoFit=true,
}:any, ref){
  injectCSS();
  const container = useRef<HTMLDivElement>(null);
  const map       = useRef<maplibregl.Map|null>(null);
  const markers   = useRef<Record<string,maplibregl.Marker>>({});
  const pickMarker= useRef<maplibregl.Marker|null>(null);
  const [activeStyle, setActiveStyle] = useState('OpenStreetMap 3D');

  useEffect(() => {
    setActiveStyle('OpenStreetMap 3D');
  }, [mapType]);

  useImperativeHandle(ref,()=>({
    animateToRegion:(r:any,dur=1000)=>{
      if(!map.current)return;
      const z=r.latitudeDelta>0?Math.round(Math.log2(360/Math.max(r.latitudeDelta,r.longitudeDelta))):13;
      map.current.flyTo({center:[r.longitude,r.latitude],zoom:z,duration:dur,essential:true});
    }
  }));

  /* Init map */
  useEffect(()=>{
    if(!container.current||map.current)return;
    const m=new maplibregl.Map({
      container:container.current,
      style:STYLES[activeStyle] as maplibregl.StyleSpecification,
      center:[initialRegion?.longitude??MAP_DEFAULTS.INITIAL_REGION.longitude, initialRegion?.latitude??MAP_DEFAULTS.INITIAL_REGION.latitude],
      zoom: initialRegion?.zoom ?? (activeStyle==='Dark Matter'?4:13),
      attributionControl:false,
      interactive:dragging&&(scrollEnabled||zoomEnabled),
    });
    m.once('style.load', () => {
      // @ts-ignore
      if (m.setProjection) m.setProjection({ type: 'globe' });
    });
    map.current=m;

    /* Click-to-place */
    if(showPlacePicker||onMapPress){
      m.on('click',(e)=>{
        const {lng,lat}=e.lngLat;
        if(showPlacePicker){
          if(pickMarker.current) pickMarker.current.remove();
          const el=document.createElement('div');
          el.className='m-place';
          pickMarker.current=new maplibregl.Marker({element:el}).setLngLat([lng,lat]).addTo(m);
        }
        onMapPress?.({latitude:lat, longitude:lng});
      });
    }

    /* moveend event */
    m.on('moveend',()=>{
      if(!onRegionChangeComplete)return;
      const c=m.getCenter(),b=m.getBounds();
      onRegionChangeComplete({latitude:c.lat,longitude:c.lng,latitudeDelta:Math.abs(b.getNorth()-b.getSouth()),longitudeDelta:Math.abs(b.getEast()-b.getWest())});
    });

    return ()=>{m.remove();map.current=null;};
  },[]);

  /* Style change */
  useEffect(()=>{
    if(!map.current)return;
    map.current.setStyle(STYLES[activeStyle] as maplibregl.StyleSpecification);
    // re-draw routes/arcs after style loads
    map.current.once('styledata',()=>{ drawRoutes(); drawArcs(); });
  },[activeStyle]);

  /* Routes */
  function drawRoutes(){
    const m=map.current; if(!m||!routes?.length)return;
    routes.forEach((r:any,i:number)=>{
      const id=`route-${i}`;
      if(m.getLayer(id))m.removeLayer(id);
      if(m.getSource(id))m.removeSource(id);
      m.addSource(id,{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:r.coordinates},properties:{}}});
      m.addLayer({id,type:'line',source:id,paint:{'line-color':r.color||'#818cf8','line-width':r.width||3,'line-opacity':.85,'line-dasharray':r.dashed?[2,2]:[1]}});
    });
  }
  useEffect(()=>{ if(map.current?.isStyleLoaded()) drawRoutes(); },[routes]);

  /* Arcs */
  function drawArcs(){
    const m=map.current; if(!m||!arcs?.length)return;
    arcs.forEach((a:any,i:number)=>{
      const id=`arc-${i}`;
      if(m.getLayer(id))m.removeLayer(id);
      if(m.getSource(id))m.removeSource(id);
      const coords=greatCircleArc([a.from.longitude,a.from.latitude],[a.to.longitude,a.to.latitude]);
      m.addSource(id,{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:coords},properties:{}}});
      m.addLayer({id,type:'line',source:id,paint:{'line-color':a.color||'#06b6d4','line-width':a.width||2,'line-opacity':.7,'line-dasharray':[3,2]}});
    });
  }
  useEffect(()=>{ if(map.current?.isStyleLoaded()) drawArcs(); },[arcs]);

  /* Region jump */
  useEffect(()=>{
    if(map.current&&initialRegion)
      map.current.jumpTo({center:[initialRegion.longitude,initialRegion.latitude]});
  },[initialRegion?.latitude,initialRegion?.longitude]);

  /* Cluster source */
  useEffect(()=>{
    const m=map.current; if(!m||!clusters)return;
    m.once('load',()=>{
      m.addSource('stores-cluster',{type:'geojson',cluster:true,clusterMaxZoom:12,clusterRadius:50,data:{type:'FeatureCollection',features:[]}});
      m.addLayer({id:'clusters',type:'circle',source:'stores-cluster',filter:['has','point_count'],paint:{'circle-color':['step',['get','point_count'],'#818cf8',5,'#06b6d4',10,'#10b981'],'circle-radius':['step',['get','point_count'],20,5,28,10,34],'circle-stroke-width':2,'circle-stroke-color':'rgba(255,255,255,.4)'}});
      m.addLayer({id:'cluster-count',type:'symbol',source:'stores-cluster',filter:['has','point_count'],layout:{'text-field':'{point_count_abbreviated}','text-font':['Open Sans Bold'],'text-size':13}});
    });
  },[clusters]);

  /* Controls */
  const locate=()=>{
    if(!navigator?.geolocation||!map.current)return;
    navigator.geolocation.getCurrentPosition(p=>{
      map.current?.flyTo({center:[p.coords.longitude,p.coords.latitude],zoom:14,duration:1200,essential:true});
    });
  };
  const toggleFullscreen=()=>{
    if(!container.current)return;
    if(!document.fullscreenElement) container.current.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  return (
    <View style={[styles.container,style]}>
      <div ref={container} style={{width:'100%',height:'100%',position:'absolute'}} />

      {/* Style selector (Disabled per user request) */}
      {false && showStyleSelector&&(
        <div className="map-style-sel">
          <select value={activeStyle} onChange={e=>setActiveStyle(e.target.value)}
            style={{background:'rgba(10,15,25,.88)',backdropFilter:'blur(10px)',border:'1px solid rgba(255,255,255,.12)',color:'#e2e8f0',padding:'6px 28px 6px 10px',borderRadius:'10px',fontSize:'12px',fontWeight:600,cursor:'pointer',outline:'none'} as any}>
            {Object.keys(STYLES).map(k=><option key={k} value={k} style={{background:'#0d1117'}}>{k}</option>)}
          </select>
        </div>
      )}

      {/* Controls panel */}
      {showControls&&(
        <div className="map-ctrl">
          <div className="map-ctrl-btn" onClick={()=>map.current?.zoomIn()} title="Zoom in">+</div>
          <div className="map-ctrl-btn" onClick={()=>map.current?.zoomOut()} title="Zoom out">−</div>
          <div className="map-ctrl-btn" onClick={()=>map.current?.resetNorth()} title="Reset north" style={{fontSize:13}}>⬆</div>
          <div className="map-ctrl-btn" onClick={locate} title="My location">◎</div>
          <div className="map-ctrl-btn" onClick={toggleFullscreen} title="Fullscreen">⛶</div>
        </div>
      )}

      {/* Pick-place hint */}
      {showPlacePicker&&(
        <div style={{position:'absolute',bottom:16,left:'50%',transform:'translateX(-50%)',background:'rgba(10,15,25,.85)',backdropFilter:'blur(8px)',border:'1px solid rgba(245,158,11,.4)',color:'#fbbf24',padding:'7px 18px',borderRadius:20,fontSize:12,fontWeight:700,pointerEvents:'none',zIndex:10}}>
          📍 Tap on the map to place the store
        </div>
      )}

      <MarkerManager map={map.current} clusters={clusters} autoFit={autoFit}>{children}</MarkerManager>
    </View>
  );
});

/* ── MarkerManager ──────────────────────────────────────────────────────── */
function MarkerManager({map,children,clusters,autoFit=true}:{map:maplibregl.Map|null,children:any,clusters?:boolean,autoFit?:boolean}){
  const markersRef   =useRef<Record<string,maplibregl.Marker>>({});
  const autoFitted   =useRef(false);

  useEffect(()=>{
    if(!map)return;
    const arr=(Array.isArray(children)?children:[children]).flat().filter(Boolean);
    const ids=new Set<string>();

    arr.forEach((child:any,idx:number)=>{
      const p=child?.props; if(!p?.coordinate)return;
      const {coordinate:co,title,description,pinColor,type}=p;
      const id=`${co.latitude}-${co.longitude}-${title??idx}`;
      ids.add(id);
      if(markersRef.current[id])return;

      const isUser = title === 'You are here';
      const isPlace = type === 'place';
      const color =
        pinColor === 'green' ? '#10b981' :
        pinColor === 'red'   ? '#ef4444' :
        pinColor === 'blue'  ? '#818cf8' : '#818cf8';

      const el=document.createElement('div');

      if(isUser){
        el.className='m-user';
        el.innerHTML='<div class="r1"></div><div class="r2"></div><div class="dot"></div>';
      } else if(isPlace){
        el.className=''; el.style.cssText='width:22px;height:22px;border-radius:50%;background:#f59e0b;border:3px solid #fff;box-shadow:0 0 0 4px rgba(245,158,11,.3);cursor:crosshair';
      } else {
        const storeIcon = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
        el.className = 'm-store';
        el.innerHTML = `<div class="m-store-inner"><div class="pin" style="background:${color}"><div style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center">${storeIcon}</div></div>${title ? `<div class="lbl">${title}</div>` : ''}</div>`;
      }

      const storeType = isUser ? 'Current Position' : isPlace ? 'Selected Location' : 'Active Store';
      const dotColor  = isUser ? '#06b6d4' : color;
      const popup = new maplibregl.Popup({ offset: isUser ? 20 : 30, closeButton: false, className: 'mpopup' }).setHTML(`
        <div style="padding:14px 16px">
          <div style="font-weight:800;font-size:14px;margin-bottom:3px;color:#f1f5f9">${title ?? 'Location'}</div>
          ${description ? `<div style="font-size:12px;color:#94a3b8;line-height:1.5;margin-bottom:6px">${description}</div>` : ''}
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:${dotColor};font-weight:800">● ${storeType}</div>
        </div>
      `);

      const marker=new maplibregl.Marker({element:el}).setLngLat([co.longitude,co.latitude]).setPopup(popup).addTo(map);
      markersRef.current[id]=marker;
    });

    // Cleanup removed
    Object.keys(markersRef.current).forEach(id=>{
      if(!ids.has(id)){markersRef.current[id].remove();delete markersRef.current[id];}
    });

    // Auto-fit bounds to stores
    const storeCoords:[number,number][]=arr
      .map((c:any)=>c?.props).filter((p:any)=>p?.coordinate&&p.title!=='You are here')
      .map((p:any)=>[p.coordinate.longitude,p.coordinate.latitude] as [number,number]);

    if(autoFit && storeCoords.length>0&&!autoFitted.current){
      const bounds=new maplibregl.LngLatBounds();
      storeCoords.forEach(c=>bounds.extend(c));
      map.fitBounds(bounds,{padding:{top:80,bottom:60,left:60,right:60},maxZoom:13,duration:1500});
      autoFitted.current=true;
    }
  },[map,children,autoFit]);

  return null;
}

/* ── Exports ────────────────────────────────────────────────────────────── */
export const MarkerWrapper=({coordinate,title,description,pinColor,type}:any)=>null;
export {MarkerWrapper as Marker};
export const PROVIDER_DEFAULT='default';

const styles=StyleSheet.create({container:{flex:1,backgroundColor:'#0d1117',overflow:'hidden'}});
export default AppMapView;
