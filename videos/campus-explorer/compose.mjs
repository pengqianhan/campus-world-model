// Generate two independently laid-out HyperFrames films from one short script.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const schools = [
  ['UoA', '奥克兰大学'], ['AUT', '奥克兰理工大学'], ['VUW', '惠灵顿维多利亚大学'], ['Otago', '奥塔哥大学'],
  ['UC', '坎特伯雷大学'], ['Massey', '梅西大学'], ['Waikato', '怀卡托大学'], ['Lincoln', '林肯大学'],
];
const shots = [
  { id: 'hook', at: 0, end: 4, kind: 'video', file: 'hook', label: 'CLOCK TOWER · AUCKLAND', title: '这座钟楼，', emphasis: '竟然是代码写的。', note: '往近处看，还有更多细节。', source: '项目 Landmark 模型展示' },
  { id: 'schools', at: 4, end: 9 },
  { id: 'walk', at: 9, end: 12, kind: 'video', file: 'walk', label: '01 / WALK', title: '走进校园。', note: '从第三人称，到你的视角。', source: '奥克兰大学 · 项目实机画面' },
  { id: 'scooter', at: 12, end: 15, kind: 'video', file: 'scooter', label: '02 / SCOOTER', title: '换个速度。', note: '切换滑板车，继续探索。', source: '奥克兰大学 · 项目实机画面' },
  { id: 'fly', at: 15, end: 19, kind: 'video', file: 'fly', label: '03 / FLY', title: '这次，飞过屋顶。', note: '切换无人机，让视野升高。', source: '奥克兰大学 · 项目实机画面' },
  { id: 'clock', at: 19, end: 24, kind: 'video', file: 'clock', label: 'THE CLOCK TOWER', title: '值得专程，', emphasis: '走近一点。', note: '奥克兰大学 Clock Tower', source: '项目 Landmark 模型展示' },
  { id: 'detail', at: 24, end: 28, kind: 'video', file: 'detail', label: 'BUILT FROM CODE', title: '尖塔。拱窗。石材纹理。', note: '建筑与材质，由代码生成。', source: 'LiDAR 参考尺寸 · 局部细节为估计' },
  { id: 'landmarks', at: 28, end: 32 },
  { id: 'room', at: 32, end: 36, kind: 'video', file: 'room', label: 'FIND YOUR ROOM / UoA', title: '找教室，也能直达。', note: '搜索房间代码，查看楼层与空间。', source: '奥克兰大学 · 当前没有公开课表' },
  { id: 'night', at: 36, end: 40, kind: 'video', file: 'night', label: 'ONE CAMPUS · ANOTHER MOOD', title: '天黑以后，', emphasis: '再逛一次。', note: '同一座校园，换一种氛围。', source: '奥克兰大学 · 项目实机画面' },
  { id: 'cta', at: 40, end: 46 },
];
const safe = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
function make(format) {
  const portrait = format === 'portrait', w = portrait ? 1080 : 1920, h = portrait ? 1920 : 1080;
  let track = 1;
  const content = (s, extra) => `id="${s.id}-overlay" class="clip scene-content ${extra}" data-start="${s.at}" data-duration="${Math.min(46, s.end + 0.65) - s.at}" data-track-index="${track++}" data-layout-allow-overlap`;
  const media = (id, file, at, duration, type = 'video', extra = '') => type === 'video'
    ? `<video id="${id}" class="clip footage" src="assets/${format}/${file}.mp4" data-start="${at}" data-duration="${duration}" data-track-index="${track++}" muted playsinline preload="auto" ${extra}></video>`
    : `<img id="${id}" class="clip footage" src="assets/${file}" data-start="${at}" data-duration="${duration}" data-track-index="${track++}" alt="${id}" ${extra}>`;
  const scenes = shots.map((s) => {
    const duration = Math.min(46, s.end + 0.65) - s.at;
    if (s.id === 'schools') return `<section id="schools" class="scene schools" data-layout-allow-overflow>
      <div ${content(s, 'schools-content')}>
        <div class="schools-shell">
          <div class="schools-left">
            <div class="stat-row"><b class="eight enter" id="eight">8</b><div class="stat-copy"><p class="eyebrow enter">NEW ZEALAND</p><h2 class="enter">所公立大学</h2><p class="lead enter">一个入口，出发。</p></div></div>
            <div class="mini-map media-frame"><img class="footage" src="assets/${format}/campus.jpg" alt="The local Auckland campus map"></div>
          </div>
          <div class="schools-right">
            <div class="school-list">${schools.map(([code, name]) => `<div class="school enter"><span class="school-code">${code}</span><span class="school-name">${name}</span></div>`).join('')}</div>
            <p class="scope enter">奥大支持楼层与教室查询；其余学校当前展示建筑。</p>
          </div>
        </div>
      </div>
    </section>`;
    if (s.id === 'landmarks') return `<section id="landmarks" class="scene more" data-layout-allow-overflow>
      <div ${content(s, 'more-content')}>
        <div class="more-heading"><p class="eyebrow enter">MORE LANDMARKS / UoA</p><h2 class="enter">沿路，还有更多地标。</h2></div>
        <div class="photo-pair">
          <div class="photo media-frame">${media('more-house', 'old-government-house.jpg', 28, duration, 'image')}<span class="photo-name enter">Old Government House</span></div>
          <div class="photo media-frame">${media('more-library', 'library.jpg', 28, duration, 'image')}<span class="photo-name enter">General Library</span></div>
        </div>
        <p class="more-note enter">一栋栋建筑，等你走近。</p>
      </div>
    </section>`;
    if (s.id === 'cta') return `<section id="cta" class="scene cta" data-layout-allow-overflow>
      <div ${content(s, 'cta-content')}>
        <div class="cta-shell">
          <div class="cta-copy"><p class="eyebrow enter">CAMPUS WORLD MODEL</p><h2 class="enter">你会先逛哪一所？</h2><p class="cta-sub enter">打开浏览器，从你的校园开始。</p><div class="address enter"><span>campusworldmodel.com</span><span class="arrow">↗</span></div><p class="cta-open enter">非官方开源项目 · 无需下载</p></div>
          <div class="cta-picture media-frame">${media('cta-campus', `${format}/campus.jpg`, 40, 6, 'image')}<span class="picture-label enter">YOUR NEXT CAMPUS ADVENTURE</span></div>
        </div>
        <p class="credits enter">地图：© OpenStreetMap contributors · 地形及测量：LINZ<span class="credit-line">建筑细节含估计；数据范围以各校 About 为准。</span></p>
      </div>
    </section>`;
    return `<section id="${s.id}" class="scene ${s.id} film" data-layout-allow-overflow>
      <div class="media-frame film-frame">${media(`${s.id}-footage`, s.file, s.at, duration)}</div>
      <div ${content(s, 'film-content')}>
        <p class="shot-source enter">${safe(s.source)}</p>
        <div class="caption"><p class="eyebrow enter">${safe(s.label)}</p><h1 class="enter">${safe(s.title)}${s.emphasis ? `<span class="accent">${safe(s.emphasis)}</span>` : ''}</h1><p class="note enter">${safe(s.note)}</p>${['walk', 'scooter', 'fly'].includes(s.id) ? `<div class="mode-row enter">${['walk', 'scooter', 'fly'].map((m) => `<span class="mode ${s.id === m ? 'selected' : ''}">${m.toUpperCase()}</span>`).join('')}</div>` : ''}</div>
      </div>
    </section>`;
  }).join('\n');
  const css = `
    @font-face{font-family:"Microsoft YaHei";src:local("Microsoft YaHei");font-style:normal;font-weight:100 900}
    @font-face{font-family:"Consolas";src:local("Consolas");font-style:normal;font-weight:100 900}
    :root{--ink:#0f1b25;--panel:#14222e;--text:#eef3f6;--muted:#a3b3bf;--accent:#ffb454}
    *{box-sizing:border-box}html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:var(--ink);color:var(--text);font-family:"Microsoft YaHei",sans-serif}
    h1,h2,p{margin:0}#root{width:${w}px;height:${h}px;position:relative;overflow:hidden;background:var(--ink)}
    .scene{position:absolute;inset:0;width:100%;height:100%;background:var(--ink);opacity:0;overflow:hidden}.scene:first-of-type{opacity:1}
    .scene-content{width:100%;height:100%;padding:152px 72px 224px;display:flex;flex-direction:column;gap:28px;position:relative;box-sizing:border-box}
    .media-frame{overflow:hidden;position:relative;min-height:0}.film-frame{position:absolute;inset:0;width:100%;height:100%}
    .footage{width:100%;height:100%;object-fit:cover;display:block}.brand{position:absolute;top:48px;left:72px;right:72px;z-index:99;display:flex;justify-content:space-between;align-items:center;gap:24px}
    .brand-name{font:700 25px/1.2 Consolas,monospace;letter-spacing:1.1px;padding:14px 18px;background:var(--ink);color:var(--text)}
    .brand-name b{color:var(--accent)}.unofficial{background:var(--ink);padding:12px 16px;font-size:23px;color:var(--text);white-space:nowrap}
    .film-content{justify-content:space-between;pointer-events:none}.shot-source{align-self:flex-start;max-width:900px;font-size:24px;line-height:1.5;padding:10px 16px;background:var(--ink)}
    .caption{margin-top:auto;align-self:flex-start;max-width:936px;background:var(--ink);padding:28px 32px 30px;display:flex;flex-direction:column;gap:16px}
    .eyebrow{font:400 27px/1.3 Consolas,monospace;letter-spacing:2px;color:var(--accent)}h1{font-size:84px;font-weight:900;line-height:1.23;letter-spacing:-2px}h1 .accent{display:block;color:var(--accent)}
    .hook h1{font-size:91px;letter-spacing:-3px}.note{font-size:31px;line-height:1.5;color:var(--text)}.detail h1{font-size:68px;max-width:820px}.room .caption{max-width:936px;margin-top:0}.room .film-content{justify-content:flex-start;gap:24px}.room h1{font-size:74px}
    .mode-row{display:flex;gap:12px;padding-top:4px}.mode{font:400 24px/1 Consolas,monospace;padding:13px 18px;background:var(--panel);color:var(--muted)}.mode.selected{background:var(--accent);color:var(--ink);font-weight:700}
    .schools-content{justify-content:center;padding-top:170px;padding-bottom:190px}.schools-shell{display:flex;flex-direction:column;gap:40px}.schools-left{display:flex;flex-direction:column;gap:30px}.stat-row{display:flex;align-items:center;gap:44px}
    .eight{font:700 300px/.95 Consolas,monospace;letter-spacing:-22px;color:var(--accent);font-variant-numeric:tabular-nums;min-width:190px}.stat-copy{display:flex;flex-direction:column;gap:20px}.stat-copy h2{font-size:72px;font-weight:900;line-height:1.2}.lead{font-size:43px;line-height:1.4}
    .mini-map{height:390px;border:1px solid var(--muted)}.mini-map video{object-position:50% 45%}.schools-right{display:flex;flex-direction:column;gap:32px}.school-list{display:grid;grid-template-columns:1fr 1fr;gap:28px 36px}
    .school{display:flex;flex-direction:column;gap:5px;border-top:1px solid var(--muted);padding-top:14px}.school-code{font:400 28px/1.2 Consolas,monospace;color:var(--accent)}.school-name{font-size:34px;line-height:1.45;white-space:nowrap}.scope{font-size:26px;line-height:1.65;color:var(--text);max-width:920px}
    .more-content{padding-top:170px;gap:35px;padding-bottom:200px}.more-heading{display:flex;flex-direction:column;gap:22px}.more h2{font-size:66px;font-weight:900;line-height:1.2}.photo-pair{display:flex;flex-direction:column;gap:24px;flex:1;min-height:0}.photo{flex:1;border:1px solid var(--muted);min-height:0}.photo-name,.picture-label{position:absolute;bottom:18px;left:18px;padding:12px 16px;background:var(--ink);font:400 25px/1.3 Consolas,monospace}.photo-name{color:var(--text)}.more-note{font-size:35px;line-height:1.5}
    .cta-content{padding-top:185px;padding-bottom:160px;justify-content:center;gap:35px}.cta-shell{display:flex;flex-direction:column;gap:58px}.cta-copy{display:flex;flex-direction:column;gap:32px}.cta h2{font-size:86px;font-weight:900;line-height:1.3;letter-spacing:-3px;white-space:nowrap}.cta-sub{font-size:41px;line-height:1.4}
    .address{display:flex;align-items:center;gap:25px;font:700 56px/1.25 Consolas,monospace;color:var(--ink);background:var(--accent);padding:22px 24px;align-self:flex-start}.arrow{font-size:64px;line-height:1}.cta-open{font-size:29px;line-height:1.5;color:var(--text)}.cta-picture{height:540px;border:1px solid var(--muted)}.cta-picture img{object-position:50% 44%}.picture-label{font-size:23px;color:var(--accent)}.credits{font-size:23px;line-height:1.8;color:var(--text)}
    .credit-line{display:block}.footer{position:absolute;left:72px;right:72px;bottom:68px;z-index:100;display:flex;justify-content:space-between;gap:24px;font:400 28px/1.4 Consolas,monospace}.footer span{background:var(--ink);padding:8px 13px;color:var(--text)}
    body.landscape .scene-content{padding:145px 110px 115px;gap:24px}body.landscape .brand{top:40px;left:110px;right:110px}body.landscape .brand-name{font-size:25px}body.landscape .footer{left:110px;right:110px;bottom:35px}
    body.landscape .caption{max-width:1350px;padding:22px 30px;gap:10px}body.landscape h1{font-size:79px}body.landscape .detail h1{font-size:74px;max-width:1100px}body.landscape .hook h1{font-size:87px}body.landscape .hook h1 .accent{display:inline;margin-left:8px}body.landscape .note{font-size:30px}body.landscape .shot-source{align-self:flex-end}
    body.landscape .schools-shell{flex-direction:row;align-items:center;gap:95px}body.landscape .schools-left{width:625px;flex-shrink:0;gap:34px}body.landscape .stat-row{gap:38px}body.landscape .eight{font-size:255px;min-width:165px}body.landscape .stat-copy h2{font-size:58px;white-space:nowrap}body.landscape .stat-copy .eyebrow{font-size:24px}body.landscape .lead{font-size:34px;white-space:nowrap}body.landscape .mini-map{height:285px}body.landscape .schools-right{flex:1;gap:35px}body.landscape .school-list{gap:30px 30px}body.landscape .school-name{font-size:31px}body.landscape .school-code{font-size:27px}body.landscape .scope{font-size:26px}
    body.landscape .more-content{gap:30px}body.landscape .more-heading{flex-direction:row;align-items:center;justify-content:space-between}body.landscape .more h2{font-size:64px}body.landscape .photo-pair{flex-direction:row;gap:28px}body.landscape .more-note{font-size:28px}
    body.landscape .cta-content{padding-top:170px;gap:34px}body.landscape .cta-shell{flex-direction:row;gap:70px;align-items:center}body.landscape .cta-copy{width:1030px;flex-shrink:0;gap:32px}body.landscape .cta h2{font-size:87px}body.landscape .cta-sub{font-size:36px}body.landscape .address{font-size:58px}body.landscape .cta-picture{width:600px;height:530px}body.landscape .credits{font-size:22px}body.landscape .picture-label{font-size:18px;left:10px;bottom:10px;padding:12px}
    .eyebrow,.shot-source,.mode,.school-code,.scope,.photo-name,.picture-label,.credits,.unofficial,.brand-name,body.landscape .eyebrow,body.landscape .shot-source,body.landscape .school-code,body.landscape .scope,body.landscape .credits,body.landscape .picture-label,body.landscape .brand-name,body.landscape .stat-copy .eyebrow{font-size:28px}
  `;
  const timeline = shots.map((s, i) => {
    const d = s.id === 'clock' ? 0.65 : s.id === 'cta' ? 0.6 : 0.35;
    return `
      ${i ? `tl.fromTo('#${s.id}', {opacity:0${s.id === 'schools' ? ',x:80' : ''}}, {opacity:1${s.id === 'schools' ? ',x:0' : ''},duration:${d},ease:'sine.inOut'}, ${s.at});` : `tl.from('#hook', {opacity:0.92,duration:0.22,ease:'power1.out'},0.1);`}
      tl.from('#${s.id} .media-frame', {scale:${s.id === 'hook' ? 1.04 : 1.018},opacity:${s.id === 'hook' ? 0.88 : 0},duration:${s.id === 'clock' ? 1 : 0.48},ease:'power2.out'},${s.at + 0.12});
      document.querySelectorAll('#${s.id} .enter').forEach(function(el,j){
        var style=j%3;
        var vars=style===0?{y:26,opacity:0,ease:'power3.out'}:style===1?{x:-28,opacity:0,ease:'expo.out'}:{scale:0.975,opacity:0,ease:'sine.out'};
        vars.duration=style===1?0.5:0.6;
        tl.from(el,vars,${s.at + 0.22}+Math.min(j*${s.id === 'schools' ? 0.045 : 0.085},0.45));
      });
    `;
  }).join('\n');
  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=${w},height=${h}"><title>Campus World Model — 非官方校园探索宣传片</title><script src="assets/gsap.min.js"></script><style>${css}</style></head>
<body class="${format}"><div id="root" data-composition-id="campus-explorer" data-start="0" data-duration="46" data-width="${w}" data-height="${h}" data-fps="30">
${scenes}
<div class="brand"><span class="brand-name"><b>CWM</b> / EXPLORE YOUR CAMPUS</span><span class="unofficial">非官方 · 开源</span></div>
<div class="footer"><span>CAMPUS WORLD MODEL</span><span>8 SCHOOLS / 1 WORLD</span></div>
<audio id="score" src="assets/soundtrack.wav" data-start="0" data-duration="46" data-track-index="99" data-volume="0.88"></audio>
</div><script>
window.__timelines=window.__timelines||{};
const tl=gsap.timeline({paused:true});
${timeline}
tl.from('.brand-name',{x:-20,opacity:0,duration:0.45,ease:'power3.out'},0.15);
tl.from('.unofficial',{opacity:0,duration:0.5,ease:'sine.out'},0.3);
tl.from('.footer span',{y:12,opacity:0,duration:0.5,stagger:0.1,ease:'expo.out'},0.4);
window.__timelines['campus-explorer']=tl;
</script></body></html>\n`.replace(/[ \t]+$/gm, '');
}
fs.writeFileSync(path.join(here, 'index.html'), make('portrait'));
fs.mkdirSync(path.join(here, 'versions'), { recursive: true });
fs.writeFileSync(path.join(here, 'versions/landscape.html'), make('landscape').replaceAll('src="assets/', 'src="../assets/'));
fs.writeFileSync(path.join(here, 'storyboard.json'), JSON.stringify({ duration: 46, language: 'zh-CN', formats: ['1080x1920', '1920x1080'], scenes: shots }, null, 2) + '\n');
console.log('Wrote the portrait and landscape compositions.');
