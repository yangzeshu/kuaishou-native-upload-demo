/* ================= 快手原生端上传 · 短剧详情页 ================= */

const params = new URLSearchParams(location.search);
const dramaId = params.get('id');
let EXTRA = [];
try { EXTRA = JSON.parse(sessionStorage.getItem('ks_extra_dramas') || '[]'); } catch (e) { EXTRA = []; }
let drama = DRAMAS.find(d => d.id === dramaId) || EXTRA.find(d => d.id === dramaId) || null;
let episodes = [];
let page = 1;
const PAGE_SIZE = 20;

const RETRYABLE = ['upload_failed', 'create_failed'];
const ONLINE_CLS = { '已上线': 'pill-green', '预上线': 'pill-blue', '待上线': 'pill-gray' };

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toast(msg, type) {
  const wrap = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'err' ? ' err' : '');
  el.innerHTML = `<span class="tico"><svg width="14" height="14"><use href="#${type === 'err' ? 'i-xcircle' : 'i-check'}"/></svg></span><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 220); }, 2400);
}
function copyId(text) {
  const done = () => toast('已复制快手短剧ID');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else fallback();
  function fallback() {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败', 'err'); }
    ta.remove();
  }
}

function statusBadge(d) {
  const cfg = SYNC_STATUS[d.syncStatus];
  const dot = d.syncStatus === 'uploading' ? '<i class="pulse"></i>' : '<i class="dot"></i>';
  return `<span class="pill ${cfg.cls}">${dot}${cfg.label}</span>`;
}

function renderHeader() {
  document.getElementById('dTitle').textContent = drama.name;
  document.getElementById('dBadge').innerHTML = statusBadge(drama);
  document.getElementById('dSub').innerHTML = `
    <span>短剧编号 <span class="mono" style="color:var(--ink-2)">${drama.dramaCode}</span></span>
    <span style="color:#dfe3ea">|</span>
    <span>剧本 <span class="mono" style="color:var(--ink-2)">${drama.scriptCode}</span></span>
    <span style="color:#dfe3ea">|</span>
    <span>${drama.uploader} 于 ${drama.uploadTime} 提交</span>`;

  const actions = [];
  if (drama.syncStatus === 'create_failed') {
    actions.push(`<button class="btn btn-default" onclick="showReason()">查看失败原因</button>`);
  }
  if (RETRYABLE.includes(drama.syncStatus)) {
    actions.push(`<button class="btn btn-primary" onclick="openRetry()"><svg class="ico" width="14" height="14"><use href="#i-bolt"/></svg>重试上传</button>`);
  }
  document.getElementById('dActions').innerHTML = actions.join('');
}

function renderBase() {
  const d = drama;
  let kwaiCell = '<span class="muted">—</span>';
  if (d.syncStatus === 'success') {
    kwaiCell = `<span class="mono">${d.kwaiDramaId}</span>
      <button class="copy-mini" title="复制" onclick="copyId('${d.kwaiDramaId}')"><svg width="12" height="12"><use href="#i-copy"/></svg></button>`;
  } else if (d.syncStatus === 'create_failed') {
    kwaiCell = `<span class="muted">—</span><button class="link" style="font-size:12px" onclick="showReason()">查看失败原因</button>`;
  } else if (d.syncStatus === 'uploading' || d.syncStatus === 'upload_failed') {
    kwaiCell = `<span class="muted">—</span>`;
  }

  document.getElementById('baseBody').innerHTML = `
    <div class="detail-cover">
      <img src="${poster(d)}" alt="${esc(d.name)}"/>
      <span class="lang-badge">${esc(d.lang)}</span>
    </div>
    <div class="base-main">
      <div class="base-name-row">
        <h2 class="base-name">${esc(d.name)}</h2>
      </div>
      <div class="base-meta">
        <span>编号 <span class="mono">${d.dramaCode}</span></span>
        <span>${d.episodes} 集</span>
        <span>时长 ${d.duration}</span>
        <span>语言 ${esc(d.lang)}</span>
      </div>
      <div class="info-grid">
        <div class="info-item"><div class="k">剧本名称</div><div class="v">${esc(d.scriptName)}</div></div>
        <div class="info-item"><div class="k">剧本编号</div><div class="v"><span class="code-chip blue">${d.scriptCode}</span></div></div>
        <div class="info-item">
          <div class="k">上线状态
            <span class="tip" data-tip="该短剧在ns_app的上线状态" style="color:var(--ink-4);cursor:help;">
              <svg width="12" height="12"><use href="#i-help"/></svg>
            </span>
          </div>
          <div class="v">
            <span class="pill ${ONLINE_CLS[d.onlineStatus]}"><i class="dot"></i>${d.onlineStatus}</span>
          </div>
        </div>
        <div class="info-item"><div class="k">付费集数</div><div class="v">${d.paidEpisodes} <span class="muted">/ ${d.episodes} 集</span></div></div>
        <div class="info-item"><div class="k">快手同步状态</div><div class="v">${statusBadge(d)}</div></div>
        <div class="info-item"><div class="k">快手短剧ID</div><div class="v" style="gap:4px">${kwaiCell}</div></div>
        <div class="info-item"><div class="k">上传人</div><div class="v">${d.uploader}</div></div>
        <div class="info-item"><div class="k">上传时间</div><div class="v">${d.uploadTime}</div></div>
      </div>
    </div>`;
}

function epStatusCell(ep) {
  if (ep.transcodeStatus === 'success') return `<span class="pill pill-green"><i class="dot"></i>转码成功</span>`;
  if (ep.transcodeStatus === 'failed') return `<span class="pill pill-red" title="${esc(ep.note)}"><i class="dot"></i>转码失败</span>`;
  return `<span class="pill pill-blue"><i class="pulse"></i>转码中</span>`;
}

function renderEpisodes() {
  const total = episodes.length;
  const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > maxPage) page = maxPage;
  const rows = episodes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  document.getElementById('epBody').innerHTML = rows.map(ep => `
    <tr>
      <td><span class="ep-index">EP ${String(ep.index).padStart(2, '0')}</span></td>
      <td class="ep-file">${esc(ep.fileName)}</td>
      <td class="ep-id">${esc(ep.fileId)}</td>
      <td>${ep.format}</td>
      <td class="ep-video">${esc(ep.videoId)}</td>
      <td>${epStatusCell(ep)}</td>
    </tr>`).join('');

  const ok = episodes.filter(e => e.transcodeStatus === 'success').length;
  const fail = episodes.filter(e => e.transcodeStatus === 'failed').length;
  const ing = episodes.filter(e => e.transcodeStatus === 'processing').length;
  document.getElementById('epSummary').innerHTML =
    `共 ${total} 集 · 转码成功 <b style="color:var(--green)">${ok}</b>` +
    (fail ? ` · 转码失败 <b style="color:var(--red)">${fail}</b>` : '') +
    (ing ? ` · 转码中 <b style="color:var(--blue)">${ing}</b>` : '');

  const pager = document.getElementById('epPager');
  if (!total) { pager.innerHTML = ''; return; }
  const pages = [];
  for (let i = 1; i <= maxPage; i++) pages.push(i);
  pager.innerHTML = `
    <span class="pager-info">第 ${page}/${maxPage} 页</span>
    <button class="pg-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>
      <svg width="12" height="12" style="transform:rotate(180deg)"><use href="#i-chev"/></svg>
    </button>
    ${pages.map(p => `<button class="pg-btn ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`).join('')}
    <button class="pg-btn" data-page="${page + 1}" ${page >= maxPage ? 'disabled' : ''}>
      <svg width="12" height="12"><use href="#i-chev"/></svg>
    </button>`;
  pager.querySelectorAll('.pg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      page = Number(btn.dataset.page);
      renderEpisodes();
    });
  });
}

function renderAll() {
  episodes = buildEpisodes(drama);
  renderHeader();
  renderBase();
  renderEpisodes();
}

/* ---------- retry ---------- */
function openRetry() {
  document.getElementById('retryScope').innerHTML =
    `重试记录：<b style="color:var(--ink)">${esc(drama.name)}</b>（${drama.dramaCode}）`;
  document.getElementById('modal-retry').classList.remove('hidden');
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
document.querySelectorAll('.mask').forEach(m => {
  m.addEventListener('mousedown', e => { if (e.target === m) closeModal(m.id); });
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.mask:not(.hidden)').forEach(m => closeModal(m.id));
});

function confirmRetry() {
  closeModal('modal-retry');
  drama.syncStatus = 'uploading';
  drama.uploadedEpisodes = Math.max(0, drama.episodes - (drama.failedEpisodes || 0));
  drama.failedEpisodes = 0;
  delete drama.failReason;
  page = 1;
  renderAll();
  toast('已提交重试，正在重新上传物料');

  setTimeout(() => {
    if (drama.syncStatus !== 'uploading') return;
    drama.syncStatus = 'success';
    drama.uploadedEpisodes = drama.episodes;
    drama.kwaiDramaId = String(Date.now()).slice(0, 13) + String(Math.floor(Math.random() * 900000) + 100000);
    renderAll();
    toast('重试成功，短剧已创建');
  }, 6000);
}

/* ---------- reason ---------- */
function showReason() {
  const f = drama.failReason;
  if (!f) return;
  document.getElementById('reasonBody').innerHTML = `
    <div class="reason-hero">
      <span class="rico"><svg width="17" height="17"><use href="#i-warn"/></svg></span>
      <div>
        <div class="rtitle">快手返回失败原因</div>
        <div class="rmsg">${esc(f.msg)}</div>
      </div>
    </div>
    <dl class="kv">
      <dt>短剧名称</dt><dd class="plain">${esc(drama.name)}</dd>
      <dt>短剧编号</dt><dd>${drama.dramaCode}</dd>
      <dt>错误码</dt><dd>${esc(f.code)}</dd>
      <dt>traceId</dt><dd>${esc(f.traceId)}</dd>
      <dt>失败时间</dt><dd>${esc(f.time)}</dd>
    </dl>
    <div class="reason-quote">{"result":0,"errorCode":"${esc(f.code)}","errorMsg":"${esc(f.msg)}","traceId":"${esc(f.traceId)}"}</div>`;
  document.getElementById('modal-reason').classList.remove('hidden');
}

/* ---------- init ---------- */
if (!drama) {
  document.querySelector('.detail-head').classList.add('hidden');
  document.querySelector('.base-card').classList.add('hidden');
  document.querySelector('.ep-card').classList.add('hidden');
  document.getElementById('notFound').classList.remove('hidden');
} else {
  renderAll();
}
