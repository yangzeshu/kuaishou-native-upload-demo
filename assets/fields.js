/* ================= 短剧信息字段（任务新建 / 创建失败重试共用） ================= */

const DF_APPS = ['ns_app', 'iaa小程序', 'iap小程序'];

function dfEsc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function dfCoverHTML(src) {
  return `<div class="cover-up ${src ? 'has-img' : ''}" data-f="cover">
    ${src ? `<img src="${src}" alt="封面"/>` : ''}
    <span class="ph"><svg width="15" height="15"><use href="#i-plus"/></svg><em>上传</em></span>
    <input type="file" accept="image/*" hidden/>
  </div>
  <div class="err-msg"></div>`;
}

function dfFieldGrid(d) {
  return `<div class="form-grid">
    <div class="fi full"><div class="fl">短剧ID</div><div class="fv mono" style="font-size:12px">${d.dramaCode}</div></div>
    <div class="fi full">
      <div class="fl">标题<i>*</i></div>
      <input class="input" data-f="title" maxlength="100" value="${dfEsc(d.name)}"/>
      <div class="err-msg"></div>
    </div>
    <div class="fi full">
      <div class="fl">简介<i>*</i></div>
      <textarea class="textarea" data-f="desc" maxlength="1500" rows="3">${dfEsc(d.description || '')}</textarea>
      <div class="err-msg"></div>
    </div>
  </div>
  <div class="form-row">
    <div class="fi fi-cover"><div class="fl">封面<i>*</i></div>${dfCoverHTML(d.cover || poster(d))}</div>
    <div class="fi">
      <div class="fl">总集数<i>*</i></div>
      <input class="input" data-f="episodes" type="number" min="1" value="${d.episodes}"/>
      <div class="err-msg"></div>
    </div>
    <div class="fi">
      <div class="fl">付费卡点<i>*</i></div>
      <input class="input" data-f="paid" type="number" min="1" value="${d.paidEpisodes}"/>
      <div class="err-msg"></div>
    </div>
  </div>`;
}

function dfSetErr(el, msg) {
  el.classList.toggle('invalid', !!msg);
  const box = el.closest('.fi') || el.closest('.cell');
  if (box) {
    const m = box.querySelector('.err-msg');
    if (m) m.textContent = msg || '';
  }
}

/* 读取并校验容器内的 7 个字段；返回 { ok, values } */
function dfRead(root) {
  const titleEl = root.querySelector('[data-f="title"]');
  const descEl = root.querySelector('[data-f="desc"]');
  const coverEl = root.querySelector('[data-f="cover"]');
  const epsEl = root.querySelector('[data-f="episodes"]');
  const paidEl = root.querySelector('[data-f="paid"]');
  const coverImg = coverEl ? coverEl.querySelector('img') : null;

  const title = titleEl.value.trim();
  const desc = descEl.value.trim();
  const cover = coverImg ? coverImg.getAttribute('src') : '';
  const epsRaw = epsEl.value.trim();
  const paidRaw = paidEl.value.trim();
  const eps = /^\d+$/.test(epsRaw) && Number(epsRaw) > 0 ? Number(epsRaw) : 0;
  const paid = /^\d+$/.test(paidRaw) && Number(paidRaw) > 0 ? Number(paidRaw) : 0;

  dfSetErr(titleEl, title ? '' : '请输入标题');
  dfSetErr(descEl, desc ? '' : '请输入简介');
  dfSetErr(coverEl, cover ? '' : '请上传封面');
  dfSetErr(epsEl, eps ? '' : '请输入正整数');
  dfSetErr(paidEl, !paid ? '请输入正整数' : (eps && paid > eps ? '不能大于总集数' : ''));

  const ok = !!(title && desc && cover && eps && paid && paid <= eps);
  return { ok, values: { title, desc, cover, episodes: eps, paid } };
}

/* 百分比 3:4 校验（含少量容差） */
function dfIsThreeFour(w, h) {
  return h > 0 && Math.abs(w / h - 0.75) <= 0.02;
}

document.addEventListener('click', e => {
  if (e.target.matches('input[type="file"]')) return;
  const box = e.target.closest('.cover-up');
  if (!box) return;
  e.preventDefault();
  box.querySelector('input[type="file"]').click();
});

document.addEventListener('change', e => {
  const input = e.target.closest('.cover-up input[type="file"]');
  if (!input) return;
  const file = input.files && input.files[0];
  if (!file) return;
  const box = input.closest('.cover-up');

  const reader = new FileReader();
  reader.onload = () => {
    const probe = new Image();
    probe.onload = () => {
      if (!dfIsThreeFour(probe.naturalWidth, probe.naturalHeight)) {
        if (window.toast) toast('封面尺寸必须为 3:4', 'err');
        input.value = '';
        return;
      }
      /* 按 3:4 居中裁切并压缩，便于演示数据持久化 */
      const W = 300, H = 400;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      const scale = Math.max(W / probe.naturalWidth, H / probe.naturalHeight);
      const w = probe.naturalWidth * scale, h = probe.naturalHeight * scale;
      ctx.drawImage(probe, (W - w) / 2, (H - h) / 2, w, h);

      let img = box.querySelector('img');
      if (!img) {
        img = document.createElement('img');
        box.insertBefore(img, box.firstChild);
      }
      img.src = canvas.toDataURL('image/jpeg', 0.85);
      img.alt = '封面';
      box.classList.add('has-img');
      box.classList.remove('invalid');
      const cell = box.closest('.fi') || box.closest('.cell');
      if (cell) {
        const m = cell.querySelector('.err-msg');
        if (m) m.textContent = '';
      }
    };
    probe.onerror = () => { if (window.toast) toast('图片读取失败，请重试', 'err'); };
    probe.src = reader.result;
  };
  reader.readAsDataURL(file);
});

document.addEventListener('input', e => {
  const f = e.target.closest('[data-f]');
  if (!f) return;
  f.classList.remove('invalid');
  const cell = f.closest('.fi') || f.closest('.cell');
  if (cell) {
    const m = cell.querySelector('.err-msg');
    if (m) m.textContent = '';
  }
});
