/* ================= Demo data =================
 * 全部为演示数据，不含真实业务数据。
 * 剧本编号规则：B / N / L / P + 4 位数字
 */

const PALETTES = [
  ['#2f4f7f', '#5b7fb9'],
  ['#8a3b2e', '#c9764f'],
  ['#33403f', '#6d8f7c'],
  ['#4a2f55', '#8b5e9e'],
  ['#7b2d3b', '#b65b6b'],
  ['#1f3a4d', '#3f7d94'],
  ['#5c4326', '#a5803f'],
  ['#2c2f45', '#5a6088'],
  ['#0f4d4a', '#2e8b7f'],
  ['#6a2c4c', '#a25f85']
];

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function wrapTitle(title, perLine, maxLines) {
  const lines = [];
  for (let i = 0; i < title.length && lines.length < maxLines; i += perLine) {
    lines.push(title.slice(i, i + perLine));
  }
  if (lines.length === maxLines && title.length > perLine * maxLines) {
    lines[maxLines - 1] = lines[maxLines - 1].slice(0, perLine - 1) + '…';
  }
  return lines;
}

function poster(d) {
  if (d.cover) return d.cover;
  const idx = hashStr(d.id) % PALETTES.length;
  const [c1, c2] = PALETTES[idx];
  const lines = wrapTitle(d.name, 6, 3);
  const tspans = lines.map((l, i) =>
    `<tspan x="20" dy="${i === 0 ? 0 : 30}">${l}</tspan>`
  ).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="320" viewBox="0 0 240 320">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
      </linearGradient>
      <linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/>
      </linearGradient>
      <linearGradient id="l" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <rect width="240" height="320" fill="url(#g)"/>
    <circle cx="196" cy="54" r="96" fill="#fff" opacity=".08"/>
    <circle cx="214" cy="128" r="52" fill="#fff" opacity=".06"/>
    <rect x="-40" y="150" width="320" height="46" fill="url(#l)" transform="rotate(-18 120 160)"/>
    <rect y="180" width="240" height="140" fill="url(#s)"/>
    <text x="20" y="30" font-family="Arial,Helvetica,sans-serif" font-size="10" letter-spacing="3"
      fill="#fff" opacity=".62">NETSHORT</text>
    <rect x="20" y="38" width="18" height="2" fill="#fff" opacity=".5"/>
    <text x="20" y="${238 - (lines.length - 1) * 30}" font-family="PingFang SC,Microsoft YaHei,sans-serif"
      font-size="26" font-weight="700" fill="#fff" letter-spacing=".5">${tspans}</text>
    <text x="20" y="298" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="12"
      fill="#fff" opacity=".72" letter-spacing="1">${d.episodes} 集${d.duration ? ' · ' + d.duration : ''}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

const DRAMAS = [
  {
    id: 'ns-210773360001', dramaCode: '210773360001', name: '我的Baby改名了', lang: '英语',
    episodes: 62, duration: '02:10:07', scriptName: 'My Baby\'s Voice Changed', scriptCode: 'B1024',
    onlineStatus: '已上线', paidEpisodes: 55, syncStatus: 'success',
    kwaiDramaId: '7345128098372610451', uploadedEpisodes: 62, uploader: '春明',
    uploadTime: '2026-11-17 14:32'
  },
  {
    id: 'ns-210773358842', dramaCode: '210773358842', name: '保安竟是隐形守门人', lang: '英语',
    episodes: 80, duration: '02:41:19', scriptName: 'He\'s the Silent Guardian', scriptCode: 'L3391',
    onlineStatus: '预上线', paidEpisodes: 70, syncStatus: 'upload_failed',
    uploadedEpisodes: 78, failedEpisodes: 2, uploader: '春明', uploadTime: '2026-11-17 13:20'
  },
  {
    id: 'ns-210773357120', dramaCode: '210773357120', name: '全球橱王：开局一地摊', lang: '英语',
    episodes: 66, duration: '02:12:50', scriptName: 'Life of a Street Vendor', scriptCode: 'B1450',
    onlineStatus: '已上线', paidEpisodes: 58, syncStatus: 'create_failed',
    app: 'ns_app', description: '摊贩陈默意外获得商业系统，从街边小摊一路逆袭成为商业大亨。',
    uploadedEpisodes: 66, uploader: '春明', uploadTime: '2026-11-17 11:08',
    failReason: {
      code: 'COURSE_MODULE_NO_FREE',
      msg: '剧集中没有免费剧集，请至少保留 1 集免费剧集后重新创建。',
      traceId: '8f2c41d9a7b64e0c9d51f7a2e3b8c604',
      time: '2026-11-17 11:41:26'
    }
  },
  {
    id: 'ns-210773355670', dramaCode: '210773355670', name: '我的小幸运', lang: '英语',
    episodes: 58, duration: '01:58:36', scriptName: 'My Little Lucky Charm', scriptCode: 'P4102',
    onlineStatus: '待上线', paidEpisodes: 48, syncStatus: 'uploading',
    uploadedEpisodes: 36, uploader: '春明', uploadTime: '2026-11-17 10:24'
  },
  {
    id: 'ns-210773354001', dramaCode: '210773354001', name: '一日，千年', lang: '英语',
    episodes: 71, duration: '02:26:44', scriptName: 'One Day, a Thousand Years', scriptCode: 'N2048',
    onlineStatus: '已上线', paidEpisodes: 63, syncStatus: 'success',
    kwaiDramaId: '7344987451208360977', uploadedEpisodes: 71, uploader: '春明',
    uploadTime: '2026-11-17 09:16'
  },
  {
    id: 'ns-210773351880', dramaCode: '210773351880', name: '离婚后，前夫跪求复合', lang: '韩语',
    episodes: 52, duration: '01:47:22', scriptName: 'Begging for a Second Chance', scriptCode: 'N8899',
    onlineStatus: '预上线', paidEpisodes: 44, syncStatus: 'create_failed',
    app: 'iaa小程序', description: '林晚离婚后重启人生，前夫却发现她才是自己真正的挚爱。',
    uploadedEpisodes: 52, uploader: '春明', uploadTime: '2026-11-16 20:05',
    failReason: {
      code: 'DATA_NOT_FOUND',
      msg: 'episodes[12].videoId 在系统中不存在，请核对该集视频是否已由当前账号提交转码。',
      traceId: '3b7e02cc85d14a6f9e0a1d77c4b29e58',
      time: '2026-11-16 20:52:11'
    }
  },
  {
    id: 'ns-210773349012', dramaCode: '210773349012', name: '豪门弃女归来', lang: '英语',
    episodes: 74, duration: '02:33:12', scriptName: 'Return of the Heiress', scriptCode: 'N2770',
    onlineStatus: '已上线', paidEpisodes: 66, syncStatus: 'success',
    kwaiDramaId: '7344760211875532801', uploadedEpisodes: 74, uploader: '春明',
    uploadTime: '2026-11-16 19:40'
  },
  {
    id: 'ns-210773347720', dramaCode: '210773347720', name: '错嫁豪门：千金归来', lang: '葡萄牙语',
    episodes: 45, duration: '01:36:55', scriptName: 'Married to the Wrong Heir', scriptCode: 'P6630',
    onlineStatus: '待上线', paidEpisodes: 38, syncStatus: 'upload_failed',
    uploadedEpisodes: 44, failedEpisodes: 1, uploader: '春明', uploadTime: '2026-11-16 18:12'
  },
  {
    id: 'ns-210773345501', dramaCode: '210773345501', name: '总裁的隐婚新娘', lang: '西班牙语',
    episodes: 60, duration: '02:04:18', scriptName: 'The CEO\'s Secret Bride', scriptCode: 'L5521',
    onlineStatus: '预上线', paidEpisodes: 52, syncStatus: 'success',
    kwaiDramaId: '7344501934629076134', uploadedEpisodes: 60, uploader: '春明',
    uploadTime: '2026-11-16 16:30'
  },
  {
    id: 'ns-210773342190', dramaCode: '210773342190', name: '重生之我在古代当首富', lang: '日语',
    episodes: 68, duration: '02:20:31', scriptName: 'Rich in Another Life', scriptCode: 'B7788',
    onlineStatus: '已上线', paidEpisodes: 60, syncStatus: 'success',
    kwaiDramaId: '7344320867410993922', uploadedEpisodes: 68, uploader: '春明',
    uploadTime: '2026-11-15 15:48'
  },
  {
    id: 'ns-210773339440', dramaCode: '210773339440', name: '天才萌宝：妈咪快跑', lang: '印尼语',
    episodes: 77, duration: '02:38:05', scriptName: 'Run, Mommy, Run', scriptCode: 'L9902',
    onlineStatus: '已上线', paidEpisodes: 69, syncStatus: 'success',
    kwaiDramaId: '7344091255736644100', uploadedEpisodes: 77, uploader: '春明',
    uploadTime: '2026-11-15 11:22'
  },
  {
    id: 'ns-210773336118', dramaCode: '210773336118', name: '落魄千金要逆袭', lang: '英语',
    episodes: 56, duration: '01:55:03', scriptName: 'The Fallen Heiress', scriptCode: 'B2244',
    onlineStatus: '已上线', paidEpisodes: 48, syncStatus: 'create_failed',
    app: 'iap小程序', description: '豪门千金一夜跌落谷底，凭借自己的能力重新站上巅峰。',
    uploadedEpisodes: 56, uploader: '春明', uploadTime: '2026-11-14 17:05',
    failReason: {
      code: 'OPEN_API_VIDEO_NOT_TRANSCODED',
      msg: 'episodes[35].videoId 对应视频尚未转码完成（status=1），请待转码完成后重新创建。',
      traceId: 'c918a0f47e2b4d0f8a3c65b1072de944',
      time: '2026-11-14 17:38:52'
    }
  },
  {
    id: 'ns-210773332870', dramaCode: '210773332870', name: '闪婚老公是首富', lang: '泰语',
    episodes: 63, duration: '02:11:47', scriptName: 'My Billionaire Flash Marriage', scriptCode: 'P1123',
    onlineStatus: '待上线', paidEpisodes: 55, syncStatus: 'creating',
    uploadedEpisodes: 63, uploader: '春明', uploadTime: '2026-11-14 10:30'
  },
  {
    id: 'ns-210773329004', dramaCode: '210773329004', name: '保镖大人请自重', lang: '英语',
    episodes: 50, duration: '01:42:39', scriptName: 'Bodyguard, Mind Your Manners', scriptCode: 'N3355',
    onlineStatus: '已上线', paidEpisodes: 42, syncStatus: 'success',
    kwaiDramaId: '7343761820945521177', uploadedEpisodes: 50, uploader: '春明',
    uploadTime: '2026-11-13 10:30'
  },
  {
    id: 'ns-210773326551', dramaCode: '210773326551', name: '重生八零：辣妻当家', lang: '英语',
    episodes: 88, duration: '02:59:18', scriptName: 'The Spicy Wife of the 80s', scriptCode: 'L4466',
    onlineStatus: '预上线', paidEpisodes: 76, syncStatus: 'uploading',
    uploadedEpisodes: 12, uploader: '春明', uploadTime: '2026-11-12 09:18'
  }
];

const LANGS = ['英语', '西班牙语', '葡萄牙语', '日语', '韩语', '印尼语', '泰语'];
const LANG_OPTIONS = [
  { name: '英语', code: 'en_US' }, { name: '繁体中文', code: 'zh_TW' }, { name: '韩语', code: 'ko_KR' },
  { name: '西班牙语', code: 'es_ES' }, { name: '日语', code: 'ja_JP' }, { name: '印尼语', code: 'id_ID' },
  { name: '泰语', code: 'th_TH' }, { name: '葡萄牙语', code: 'pt_PT' }, { name: '简体中文', code: 'zh_CN' },
  { name: '法语', code: 'fr_FR' }, { name: '德语', code: 'de_DE' }, { name: '意大利语', code: 'it_IT' },
  { name: '阿拉伯', code: 'ar_AE' }, { name: '马来语', code: 'ms_MY' }, { name: '土语', code: 'tr_TR' },
  { name: '越南语', code: 'vi_VN' }, { name: '印地语', code: 'hi_IN' }
];
const ONLINE_STATUS = ['待上线', '预上线', '已上线'];
const SYNC_STATUS = {
  uploading: { label: '物料上传中', cls: 'pill-blue', desc: '剧集视频上传 / 转码处理中' },
  creating: { label: '短剧创建中', cls: 'pill-violet', desc: '剧集视频已全部转码成功，短剧创建中' },
  upload_failed: { label: '物料上传失败', cls: 'pill-orange', desc: '存在转码失败的剧集视频' },
  create_failed: { label: '短剧创建失败', cls: 'pill-red', desc: '物料已完成，短剧创建失败' },
  success: { label: '短剧创建成功', cls: 'pill-green', desc: '已在快手创建短剧' }
};

/* 剧本去重列表，供筛选下拉 & 批量输入匹配 */
const SCRIPTS = [];
DRAMAS.forEach(d => {
  if (!SCRIPTS.some(s => s.code === d.scriptCode)) {
    SCRIPTS.push({ code: d.scriptCode, name: d.scriptName, lang: d.lang });
  }
});

/* 详情页剧集列表（按短剧状态生成稳定的演示数据） */
function buildEpisodes(d) {
  const h = hashStr(d.id);
  const list = [];
  const failRows = new Set();
  if (d.syncStatus === 'upload_failed') {
    for (let i = 0; i < (d.failedEpisodes || 1); i++) {
      failRows.add(2 + i * 4 + (h % 3));
    }
  }
  const uploadingFrom = d.uploadedEpisodes == null ? d.episodes : d.uploadedEpisodes;

  for (let i = 1; i <= d.episodes; i++) {
    const seed = hashStr(d.id + '-' + i);
    let status = 'success';
    if (d.syncStatus === 'upload_failed' && failRows.has(i)) status = 'failed';
    else if (d.syncStatus === 'uploading' && i > uploadingFrom) status = 'processing';
    const hasVideo = status !== 'processing';
    list.push({
      index: i,
      fileName: `EP${String(i).padStart(2, '0')}_${d.scriptName.replace(/[^A-Za-z0-9 ]/g, '').trim().replace(/\s+/g, '_')}.mp4`,
      fileId: 'vid_' + (seed >>> 0).toString(16).padStart(8, '0') + (seed % 97).toString(16).padStart(2, '0'),
      format: 'MP4',
      videoId: hasVideo ? 'v_' + (100000000000 + (seed % 899999999999)) : '—',
      transcodeStatus: status == 'success' ? 'success' : status == 'failed' ? 'failed' : 'processing',
      note: status === 'failed' ? 'TRANSCODE_FAILED：视频转码失败，请重试该剧集' : ''
    });
  }
  return list;
}

/* 任务新建：演示用短剧ID → 记录映射 */
const DEMO_SUBMIT_IDS = [
  { id: '210773362001', ok: true },
  { id: '210773362002', ok: true },
  { id: '210773362003', ok: false, reason: '集数与短剧生成成功的最新成片数量不一致' },
  { id: '210773362004', ok: true },
  { id: '210773362005', ok: false, reason: '短剧名称为空' },
  { id: '210773362006', ok: true },
  { id: '210773362007', ok: false, reason: '封面为空' }
];

/* 新提交任务生成的上传记录 */const SUBMIT_POOL = [
  { name: '一见钟情', scriptName: 'Love at First Sight', scriptCode: 'B5567', lang: '英语', episodes: 40, duration: '01:26:12', onlineStatus: '待上线', paidEpisodes: 33 },
  { name: '隐形富豪老公', scriptName: 'My Hidden Rich Husband', scriptCode: 'N6612', lang: '日语', episodes: 55, duration: '01:59:40', onlineStatus: '待上线', paidEpisodes: 46 },
  { name: '闪婚之后', scriptName: 'After the Flash Marriage', scriptCode: 'P7723', lang: '英语', episodes: 48, duration: '01:44:05', onlineStatus: '预上线', paidEpisodes: 40 },
  { name: '一夜暴富', scriptName: 'Suddenly Rich', scriptCode: 'L8834', lang: '葡萄牙语', episodes: 62, duration: '02:12:30', onlineStatus: '待上线', paidEpisodes: 54 },
  { name: '我的替嫁新娘', scriptName: 'My Substitute Bride', scriptCode: 'B9912', lang: '西班牙语', episodes: 49, duration: '01:45:18', onlineStatus: '待上线', paidEpisodes: 41 },
  { name: '顾少的契约甜妻', scriptName: 'The Contract Wife', scriptCode: 'N1145', lang: '泰语', episodes: 58, duration: '02:03:56', onlineStatus: '预上线', paidEpisodes: 50 },
  { name: '重生之豪门千金', scriptName: 'Reborn Heiress', scriptCode: 'P2231', lang: '韩语', episodes: 66, duration: '02:18:22', onlineStatus: '待上线', paidEpisodes: 58 }
];

/* ---------- 全局 tooltip（跟随元素，挂到 body 避免被滚动容器裁切） ---------- */
(function () {
  let el = null, owner = null;
  function hide() {
    if (el) { el.remove(); el = null; owner = null; }
  }
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('[data-tip]');
    if (!t) return;
    if (t === owner) return;
    if (t.contains(e.relatedTarget)) return;
    hide();
    owner = t;
    el = document.createElement('div');
    el.className = 'tip-float';
    el.textContent = t.dataset.tip;
    document.body.appendChild(el);
    const r = t.getBoundingClientRect();
    const w = el.offsetWidth;
    const left = Math.max(w / 2 + 8, Math.min(document.documentElement.clientWidth - w / 2 - 8, r.left + r.width / 2));
    el.style.left = left + 'px';
    el.style.top = (r.top - 8) + 'px';
  });
  document.addEventListener('mouseout', e => {
    if (owner && !owner.contains(e.relatedTarget)) hide();
  });
  document.addEventListener('scroll', hide, true);
})();
