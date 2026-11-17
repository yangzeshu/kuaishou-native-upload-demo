/* ================= 快手原生端上传 · 列表页 ================= */

const state = {
  data: DRAMAS.slice(),
  filters: { scripts: [], dramaCode: '', name: '', online: '', sync: '', uploader: '', from: '', to: '' },
  page: 1,
  pageSize: 10,
  selected: new Set(),
  retryIds: []
};

const RETRYABLE = ['upload_failed', 'create_failed'];
const ONLINE_CLS = { '已上线': 'pill-green', '预上线': 'pill-blue', '待上线': 'pill-gray' };

/* ---------- utils ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtNow() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function todayISO(offset) {
  const d = new Date();
  d.setDate(d.getDate() - (offset || 0));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function toast(msg, type) {
  const wrap = document.getElementById('toastWrap');
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'err' ? ' err' : '');
  el.innerHTML = `<span class="tico"><svg width="14" height="14"><use href="#${type === 'err' ? 'i-xcircle' : 'i-check'}"/></svg></span><span>${esc(msg)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 220); }, 2400);
}
function copyText(text) {
  const done = () => toast('已复制快手短剧ID');
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(done).catch(fallback);
  } else fallback();
  function fallback() {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败，请手动选择', 'err'); }
    ta.remove();
  }
}

/* ---------- filters ---------- */
function filteredData() {
  const f = state.filters;
  return state.data.filter(d => {
    if (f.scripts.length && !f.scripts.includes(d.scriptCode)) return false;
    if (f.dramaCode && !d.dramaCode.includes(f.dramaCode.trim())) return false;
    if (f.name && !d.name.toLowerCase().includes(f.name.trim().toLowerCase())) return false;
    if (f.online && d.onlineStatus !== f.online) return false;
    if (f.sync && d.syncStatus !== f.sync) return false;
    if (f.uploader && d.uploader !== f.uploader) return false;
    const day = d.uploadTime.slice(0, 10);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    return true;
  });
}

function applyFilters() {
  state.filters = {
    scripts: state.filters.scripts,
    dramaCode: document.getElementById('fDramaCode').value,
    name: document.getElementById('fDramaName').value,
    online: document.getElementById('fOnline').value,
    sync: document.getElementById('fSync').value,
    uploader: document.getElementById('fUploader').value,
    from: state.filters.from,
    to: state.filters.to
  };
  state.page = 1;
  render();
}

function resetFilters() {
  state.filters = { scripts: [], dramaCode: '', name: '', online: '', sync: '', uploader: '', from: '', to: '' };
  ['fDramaCode', 'fDramaName'].forEach(id => document.getElementById(id).value = '');
  ['fOnline', 'fSync', 'fUploader'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('drFrom').value = '';
  document.getElementById('drTo').value = '';
  document.getElementById('drText').textContent = '开始日期 — 结束日期';
  document.getElementById('drText').classList.remove('filled');
  renderScriptTags();
  state.page = 1;
  render();
}

function refreshList() {
  render();
  toast('列表已刷新');
}

/* ---------- table ---------- */
function syncCell(d) {
  const cfg = SYNC_STATUS[d.syncStatus];
  const dot = (d.syncStatus === 'uploading' || d.syncStatus === 'creating') ? '<i class="pulse"></i>' : '<i class="dot"></i>';
  let sub = '';
  if (d.syncStatus === 'success') {
    sub = `<div class="sync-sub"><span>快手短剧ID</span><span class="mono">${d.kwaiDramaId}</span>
      <button class="copy-mini" title="复制" data-copy="${d.kwaiDramaId}"><svg width="12" height="12"><use href="#i-copy"/></svg></button></div>`;
  } else if (d.syncStatus === 'uploading' || d.syncStatus === 'creating') {
    sub = '';
  } else if (d.syncStatus === 'upload_failed') {
    sub = `<div class="sync-sub"><span class="warn">${d.failedEpisodes} 集转码失败</span><span>·</span><span>共 ${d.episodes} 集</span></div>`;
  } else {
    sub = `<div class="sync-sub"><button class="link" data-reason="${d.id}">查看详情</button></div>`;
  }
  return `<div class="sync-cell"><span class="pill ${cfg.cls}">${dot}${cfg.label}</span>${sub}</div>`;
}

function rowHTML(d) {
  const checked = state.selected.has(d.id) ? 'checked' : '';
  const canRetry = RETRYABLE.includes(d.syncStatus);
  return `<tr data-id="${d.id}">
    <td class="check"><input type="checkbox" class="cb row-cb" data-id="${d.id}" ${checked}/></td>
    <td>
      <div class="drama-cell">
        <div class="cover"><img src="${poster(d)}" alt="${esc(d.name)}"/><span class="lang-badge">${esc(d.lang)}</span></div>
        <div class="drama-main">
          <div class="drama-name">${esc(d.name)}</div>
          <div class="meta">
            <div class="row">编号 <span class="mono">${d.dramaCode}</span></div>
            <div class="row">${d.episodes} 集 <span style="color:#dfe3ea">·</span> ${d.duration}</div>
          </div>
        </div>
      </div>
    </td>
    <td>
      <div class="script-name">${esc(d.scriptName)}</div>
      <span class="code-chip blue">${d.scriptCode}</span>
    </td>
    <td>
      <span class="pill ${ONLINE_CLS[d.onlineStatus]}"><i class="dot"></i>${d.onlineStatus}</span>
    </td>
    <td><span style="color:var(--ink);font-weight:500;">${d.paidEpisodes}</span> <span class="muted" style="font-size:11.5px;">集</span></td>
    <td>${syncCell(d)}</td>
    <td>${d.uploader}</td>
    <td class="nowrap" style="color:var(--ink-2);font-size:12.5px;">${d.uploadTime}</td>
    <td class="col-action">
      <div style="display:flex;align-items:center;gap:10px;">
        <button class="link" data-detail="${d.id}">详情</button>
        ${canRetry ? `<span style="width:1px;height:11px;background:var(--line);display:inline-block;"></span>
        <button class="link" data-retry="${d.id}">重试</button>` : ''}
      </div>
    </td>
  </tr>`;
}

function render() {
  const rows = filteredData();
  const total = rows.length;
  const maxPage = Math.max(1, Math.ceil(total / state.pageSize));
  if (state.page > maxPage) state.page = maxPage;
  const start = (state.page - 1) * state.pageSize;
  const pageRows = rows.slice(start, start + state.pageSize);

  const tbody = document.getElementById('tbody');
  tbody.innerHTML = pageRows.map(rowHTML).join('');
  document.getElementById('dramaTable').classList.toggle('hidden', total === 0);
  document.getElementById('emptyState').classList.toggle('hidden', total !== 0);

  renderPager(total, maxPage);
  syncSelectionUI();
}

function renderPager(total, maxPage) {
  const pager = document.getElementById('pager');
  if (total === 0) { pager.innerHTML = ''; return; }
  let pages = [];
  const cur = state.page;
  let from = Math.max(1, cur - 2), to = Math.min(maxPage, from + 4);
  from = Math.max(1, to - 4);
  for (let i = from; i <= to; i++) pages.push(i);

  pager.innerHTML = `
    <span class="pager-info">第 ${cur}/${maxPage} 页</span>
    <select class="select" id="pageSize">
      ${[10, 20, 50].map(n => `<option value="${n}" ${n === state.pageSize ? 'selected' : ''}>${n} 条/页</option>`).join('')}
    </select>
    <button class="pg-btn" data-page="${cur - 1}" ${cur <= 1 ? 'disabled' : ''}>
      <svg width="12" height="12" style="transform:rotate(180deg)"><use href="#i-chev"/></svg>
    </button>
    ${pages.map(p => `<button class="pg-btn ${p === cur ? 'active' : ''}" data-page="${p}">${p}</button>`).join('')}
    <button class="pg-btn" data-page="${cur + 1}" ${cur >= maxPage ? 'disabled' : ''}>
      <svg width="12" height="12"><use href="#i-chev"/></svg>
    </button>`;
  const sel = document.getElementById('pageSize');
  sel.addEventListener('change', e => { state.pageSize = Number(e.target.value); state.page = 1; render(); });
}

function syncSelectionUI() {
  const n = state.selected.size;
  const bar = document.getElementById('selBar');
  bar.classList.toggle('show', n > 0);
  document.getElementById('selCount').textContent = n;
  const rows = filteredData().slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
  const all = document.getElementById('checkAll');
  const checkedOnPage = rows.filter(r => state.selected.has(r.id)).length;
  all.checked = rows.length > 0 && checkedOnPage === rows.length;
  all.indeterminate = checkedOnPage > 0 && checkedOnPage < rows.length;
}

function clearSelection() {
  state.selected.clear();
  render();
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const detail = e.target.closest('[data-detail]');
  if (detail) { location.href = '短剧详情.html?id=' + encodeURIComponent(detail.dataset.detail); return; }

  const copy = e.target.closest('[data-copy]');
  if (copy) { copyText(copy.dataset.copy); return; }

  const reason = e.target.closest('[data-reason]');
  if (reason) { showReason(reason.dataset.reason); return; }

  const retry = e.target.closest('[data-retry]');
  if (retry) { openRetry([retry.dataset.retry]); return; }

  const pageBtn = e.target.closest('.pg-btn');
  if (pageBtn && !pageBtn.disabled) {
    const p = Number(pageBtn.dataset.page);
    if (p >= 1) { state.page = p; render(); }
    return;
  }

  if (!e.target.closest('#scriptSelect')) document.getElementById('scriptSelect').classList.remove('is-open');
  if (!e.target.closest('#dateRange')) document.getElementById('dateRange').classList.remove('is-open');
});

document.getElementById('tbody').addEventListener('change', e => {
  const cb = e.target.closest('.row-cb');
  if (!cb) return;
  if (cb.checked) state.selected.add(cb.dataset.id); else state.selected.delete(cb.dataset.id);
  syncSelectionUI();
});

document.getElementById('checkAll').addEventListener('change', e => {
  const rows = filteredData().slice((state.page - 1) * state.pageSize, state.page * state.pageSize);
  rows.forEach(r => e.target.checked ? state.selected.add(r.id) : state.selected.delete(r.id));
  document.querySelectorAll('.row-cb').forEach(cb => cb.checked = e.target.checked);
  syncSelectionUI();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.mask:not(.hidden)').forEach(m => {
      const id = m.id;
      if (id === 'modal-task') closeModal(id);
      else if (id === 'modal-batch') closeModal(id);
      else if (id === 'modal-retry') closeModal(id);
      else if (id === 'modal-reason') closeModal(id);
      else if (id === 'modal-result') closeModal(id);
    });
    document.getElementById('scriptSelect').classList.remove('is-open');
    document.getElementById('dateRange').classList.remove('is-open');
  }
});

/* ---------- script multiselect ---------- */
function renderScriptTags() {
  const wrap = document.getElementById('msTags');
  wrap.innerHTML = state.filters.scripts.map(code => {
    const s = SCRIPTS.find(x => x.code === code);
    return `<span class="ms-tag"><b>${code}</b><span>${esc(s ? s.name : '')}</span><i data-rm="${code}">×</i></span>`;
  }).join('');
  document.getElementById('msBox').querySelector('.ms-input').style.display = 'block';
  wrap.querySelectorAll('[data-rm]').forEach(el => {
    el.addEventListener('click', ev => {
      ev.stopPropagation();
      state.filters.scripts = state.filters.scripts.filter(c => c !== el.dataset.rm);
      renderScriptTags(); renderDropdown(document.getElementById('msInput').value); render();
    });
  });
}

function renderDropdown(q) {
  const query = (q || '').trim().toLowerCase();
  const list = SCRIPTS.filter(s => !query || s.code.toLowerCase().includes(query) || s.name.toLowerCase().includes(query));
  const drop = document.getElementById('msDrop');
  if (!list.length) {
    drop.innerHTML = `<div class="ms-empty">未找到匹配的剧本</div>`;
    return;
  }
  drop.innerHTML = list.map(s => {
    const sel = state.filters.scripts.includes(s.code);
    return `<div class="ms-opt ${sel ? 'selected' : ''}" data-code="${s.code}">
      <span class="code">${s.code}</span>
      <span class="name">${esc(s.name)}</span>
      <span class="ck"><svg width="13" height="13"><use href="#i-check"/></svg></span>
    </div>`;
  }).join('');
  drop.querySelectorAll('.ms-opt').forEach(opt => {
    opt.addEventListener('mousedown', ev => {
      ev.preventDefault();
      toggleScript(opt.dataset.code);
    });
  });
}

function toggleScript(code) {
  const arr = state.filters.scripts;
  const i = arr.indexOf(code);
  if (i >= 0) arr.splice(i, 1); else arr.push(code);
  const input = document.getElementById('msInput');
  input.value = '';
  renderScriptTags(); renderDropdown('');
  state.page = 1; render();
}

function matchScript(raw) {
  const t = String(raw || '').trim();
  if (!t) return null;
  const up = t.toUpperCase();
  return SCRIPTS.find(s => s.code === up)
    || SCRIPTS.find(s => s.name.toLowerCase() === t.toLowerCase())
    || SCRIPTS.find(s => s.name.toLowerCase().includes(t.toLowerCase()));
}

const msBox = document.getElementById('msBox');
const msInput = document.getElementById('msInput');

msBox.addEventListener('mousedown', e => {
  if (e.target.closest('.ms-tag')) return;
  document.getElementById('scriptSelect').classList.add('is-open');
  setTimeout(() => msInput.focus(), 0);
});

msInput.addEventListener('focus', () => {
  document.getElementById('scriptSelect').classList.add('is-open');
  renderDropdown(msInput.value);
});
msInput.addEventListener('input', () => renderDropdown(msInput.value));
msInput.addEventListener('keydown', e => {
  if (e.key === 'Backspace' && !msInput.value && state.filters.scripts.length) {
    state.filters.scripts.pop();
    renderScriptTags(); renderDropdown(''); render();
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    const q = msInput.value.trim();
    if (!q) return;
    const exact = matchScript(q);
    if (!exact) { toast('未找到匹配的剧本：' + q, 'err'); return; }
    if (!state.filters.scripts.includes(exact.code)) {
      state.filters.scripts.push(exact.code);
      renderScriptTags(); renderDropdown(''); render();
    }
    msInput.value = '';
    renderDropdown('');
  }
});

/* ---------- date range ---------- */
const dr = document.getElementById('dateRange');
document.getElementById('drBox').addEventListener('click', () => dr.classList.toggle('is-open'));
document.querySelectorAll('.dr-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    const days = Number(btn.dataset.days);
    document.getElementById('drFrom').value = todayISO(days === 0 ? 0 : days - 1);
    document.getElementById('drTo').value = todayISO(0);
  });
});
document.getElementById('drClear').addEventListener('click', () => {
  document.getElementById('drFrom').value = '';
  document.getElementById('drTo').value = '';
});
document.getElementById('drApply').addEventListener('click', () => {
  const from = document.getElementById('drFrom').value;
  const to = document.getElementById('drTo').value;
  state.filters.from = from;
  state.filters.to = to;
  const txt = document.getElementById('drText');
  if (from || to) {
    txt.textContent = `${from || '不限'} — ${to || '不限'}`;
    txt.classList.add('filled');
  } else {
    txt.textContent = '开始日期 — 结束日期';
    txt.classList.remove('filled');
  }
  dr.classList.remove('is-open');
  state.page = 1;
  render();
});

/* ---------- modals ---------- */
function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
  if (id === 'modal-task') setTimeout(() => document.getElementById('taskIds').focus(), 60);
  if (id === 'modal-batch') {
    const ta = document.getElementById('batchScripts');
    ta.value = state.filters.scripts.join('\n');
    setTimeout(() => ta.focus(), 60);
  }
}
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }
document.querySelectorAll('.mask').forEach(m => {
  m.addEventListener('mousedown', e => { if (e.target === m) closeModal(m.id); });
});

/* ---------- 批量输入剧本 ---------- */
function applyBatchScripts() {
  const lines = document.getElementById('batchScripts').value.split(/\n+/).map(s => s.trim()).filter(Boolean);
  if (!lines.length) { toast('请输入剧本编号', 'err'); return; }
  let added = 0;
  const miss = [];
  lines.forEach(l => {
    const s = matchScript(l);
    if (!s) { miss.push(l); return; }
    if (!state.filters.scripts.includes(s.code)) { state.filters.scripts.push(s.code); added++; }
  });
  renderScriptTags(); renderDropdown('');
  closeModal('modal-batch');
  state.page = 1; render();
  if (added) toast(`已添加 ${added} 个剧本`);
  if (miss.length) setTimeout(() => toast(`${miss.length} 个编号未匹配到剧本：${miss.slice(0, 3).join('、')}${miss.length > 3 ? '…' : ''}`, 'err'), 300);
}

/* ---------- 任务新建 ---------- */
let lastResult = null;

function submitTask() {
  const raw = document.getElementById('taskIds').value.trim();
  const lines = raw ? raw.split(/\n+/).map(s => s.trim()).filter(Boolean) : [];
  const list = lines.length ? lines : DEMO_SUBMIT_IDS.map(x => x.id);

  const results = list.map((id, i) => {
    const preset = DEMO_SUBMIT_IDS.find(x => x.id === id);
    const pool = SUBMIT_POOL[i % SUBMIT_POOL.length];
    const existing = state.data.find(d => d.dramaCode === id);
    let ok, reason;
    if (preset) { ok = preset.ok; reason = preset.reason; }
    else {
      const h = hashStr(id);
      ok = h % 3 !== 0;
      reason = ['集数与短剧生成成功的最新成片数量不一致', '短剧名称为空', '封面为空'][h % 3];
    }
    return {
      id, ok, reason,
      name: existing ? existing.name : pool.name,
      episodes: existing ? existing.episodes : pool.episodes,
      duration: existing ? existing.duration : pool.duration,
      scriptCode: existing ? existing.scriptCode : pool.scriptCode,
      scriptName: existing ? existing.scriptName : pool.scriptName,
      lang: existing ? existing.lang : pool.lang,
      onlineStatus: existing ? existing.onlineStatus : pool.onlineStatus,
      paidEpisodes: existing ? existing.paidEpisodes : pool.paidEpisodes
    };
  });

  const okList = results.filter(r => r.ok);
  const failList = results.filter(r => !r.ok);
  lastResult = { okList, failList };

  document.getElementById('resultBody').innerHTML = `
    <div class="result-summary">
      <div class="rs-item">成功 <b class="ok">${okList.length}</b> 条</div>
      <span class="rs-comma">，</span>
      <div class="rs-item">失败 <b class="fail">${failList.length}</b> 条</div>
    </div>
    <div class="result-block">
      <div class="result-block-title"><svg width="13" height="13" style="color:var(--red)"><use href="#i-xcircle"/></svg>失败明细</div>
      ${failList.length ? `<div class="result-list"><ol>
        ${failList.map(r => `<li><b>${r.scriptCode}</b>-${esc(r.scriptName)}(${r.lang})提交失败，失败原因：<span class="fail-reason">${esc(r.reason)}</span>，<span class="sid">短剧ID:<span class="id">${r.id}</span></span></li>`).join('')}
      </ol></div>` : `<div class="result-empty">无失败记录</div>`}
    </div>
    <div class="result-block">
      <div class="result-block-title"><svg width="13" height="13" style="color:var(--green)"><use href="#i-check"/></svg>成功明细</div>
      ${okList.length ? `<div class="result-list"><ol>
        ${okList.map(r => `<li><b>${r.scriptCode}</b>-${esc(r.scriptName)}(${r.lang})提交成功，<span class="sid">短剧ID:<span class="id">${r.id}</span></span></li>`).join('')}
      </ol></div>` : `<div class="result-empty">无成功记录</div>`}
    </div>`;

  closeModal('modal-task');
  openModal('modal-result');

  /* 成功任务进入列表，状态为物料上传中 */
  if (okList.length) {
    const now = fmtNow();
    const newRows = okList.map(r => ({
      id: 'ns-' + r.id, dramaCode: r.id, name: r.name, lang: r.lang,
      episodes: r.episodes, duration: r.duration,
      scriptName: r.scriptName, scriptCode: r.scriptCode,
      onlineStatus: r.onlineStatus, paidEpisodes: r.paidEpisodes,
      syncStatus: 'uploading', uploadedEpisodes: 0, uploader: '春明', uploadTime: now
    }));
    state.data = [...newRows, ...state.data];
    try {
      const prev = JSON.parse(sessionStorage.getItem('ks_extra_dramas') || '[]');
      sessionStorage.setItem('ks_extra_dramas', JSON.stringify([...newRows, ...prev].slice(0, 30)));
    } catch (e) { /* 忽略存储异常 */ }
    render();
  }
}

/* ---------- 重试 ---------- */
function openRetry(ids) {
  state.retryIds = ids;
  const ds = ids.map(id => state.data.find(d => d.id === id)).filter(Boolean);
  document.getElementById('retryTitle').textContent = ids.length > 1 ? '批量重试上传' : '重试上传';
  document.getElementById('retryScope').innerHTML = ids.length > 1
    ? `本次将对已选 <b style="color:var(--ink)">${ids.length}</b> 条记录发起重传：${ds.slice(0, 3).map(d => esc(d.name)).join('、')}${ds.length > 3 ? ' 等' : ''}`
    : `重试记录：<b style="color:var(--ink)">${esc(ds[0].name)}</b>（${ds[0].dramaCode}）`;
  openModal('modal-retry');
}

function openBatchRetry() {
  const ids = [...state.selected].filter(id => {
    const d = state.data.find(x => x.id === id);
    return d && RETRYABLE.includes(d.syncStatus);
  });
  if (!ids.length) {
    toast('所选记录中没有可重试的任务', 'err');
    return;
  }
  if (ids.length < state.selected.size) toast(`已跳过 ${state.selected.size - ids.length} 条当前状态不可重试的记录`);
  openRetry(ids);
}

function confirmRetry() {
  const ids = state.retryIds.slice();
  closeModal('modal-retry');
  ids.forEach(id => {
    const d = state.data.find(x => x.id === id);
    if (!d) return;
    d.syncStatus = 'uploading';
    d.uploadedEpisodes = Math.max(0, d.episodes - (d.failedEpisodes || 0));
    d.failedEpisodes = 0;
  });
  state.selected.clear();
  render();
  toast(`已提交重试，正在重新上传 ${ids.length} 条任务`);

  setTimeout(() => {
    let n = 0;
    ids.forEach(id => {
      const d = state.data.find(x => x.id === id);
      if (!d || d.syncStatus !== 'uploading') return;
      d.syncStatus = 'success';
      d.uploadedEpisodes = d.episodes;
      d.kwaiDramaId = String(Date.now()).slice(0, 13) + String(Math.floor(Math.random() * 900000) + 100000);
      delete d.failReason;
      n++;
    });
    render();
    if (n) toast(`${n} 条任务重试成功，短剧已创建`);
  }, 6000);
}

/* ---------- 失败原因 ---------- */
function showReason(id) {
  const d = state.data.find(x => x.id === id);
  if (!d || !d.failReason) return;
  const f = d.failReason;
  document.getElementById('reasonBody').innerHTML = `
    <div class="reason-hero">
      <span class="rico"><svg width="17" height="17"><use href="#i-warn"/></svg></span>
      <div>
        <div class="rtitle">快手返回失败原因</div>
        <div class="rmsg">${esc(f.msg)}</div>
      </div>
    </div>
    <dl class="kv">
      <dt>短剧名称</dt><dd class="plain">${esc(d.name)}</dd>
      <dt>短剧编号</dt><dd>${d.dramaCode}</dd>
      <dt>错误码</dt><dd>${esc(f.code)}</dd>
      <dt>traceId</dt><dd>${esc(f.traceId)}</dd>
      <dt>失败时间</dt><dd>${esc(f.time)}</dd>
    </dl>
    <div class="reason-quote">{"result":0,"errorCode":"${esc(f.code)}","errorMsg":"${esc(f.msg)}","traceId":"${esc(f.traceId)}"}</div>`;
  openModal('modal-reason');
}

/* ---------- init ---------- */
document.getElementById('btnBatchScript').addEventListener('click', () => openModal('modal-batch'));
renderScriptTags();
renderDropdown('');
render();
