// src/i18n.js
export const DICTS = {
  en: {
    "nav.account": "Account",
    "nav.settings": "Settings",
    "nav.profile": "Profile",
    "nav.preferences": "Preferences",
    "nav.security": "Security",
    "nav.workspaces": "Workspaces",
    "nav.kanban": "Kanban",
    "nav.back": "Back",
    "nav.logout": "Logout",

    "prefs.language_region": "Language & region",
    "prefs.language": "Language",
    "prefs.timezone": "Timezone",
    "prefs.appearance": "Appearance",
    "prefs.theme": "Theme",
    "prefs.save": "Save preferences",
    "prefs.discard": "Discard",

    "org.title": "Workspaces",
    "org.subtitle":
      "Create or join a workspace. Open one to manage shared backlog and tasks.",
    "org.quick": "Quick actions",
    "org.go_kanban": "Go to Kanban",
    "org.create": "Create workspace",
    "org.join": "Join workspace",
    "org.search": "Search workspaces…",
    "org.sort": "Sort workspaces",
  },

  zh: {
    "nav.account": "账户",
    "nav.settings": "设置",
    "nav.profile": "个人资料",
    "nav.preferences": "偏好设置",
    "nav.security": "安全",
    "nav.workspaces": "工作区",
    "nav.kanban": "看板",
    "nav.back": "返回",
    "nav.logout": "登出",

    "prefs.language_region": "语言与地区",
    "prefs.language": "语言",
    "prefs.timezone": "时区",
    "prefs.appearance": "外观",
    "prefs.theme": "主题",
    "prefs.save": "保存偏好",
    "prefs.discard": "放弃更改",

    "org.title": "工作区",
    "org.subtitle": "创建或加入工作区。打开后可管理共享待办与任务。",
    "org.quick": "快捷操作",
    "org.go_kanban": "前往看板",
    "org.create": "创建工作区",
    "org.join": "加入工作区",
    "org.search": "搜索工作区…",
    "org.sort": "排序工作区",
  },

  ms: {
    "nav.account": "Akaun",
    "nav.settings": "Tetapan",
    "nav.profile": "Profil",
    "nav.preferences": "Keutamaan",
    "nav.security": "Keselamatan",
    "nav.workspaces": "Ruang kerja",
    "nav.kanban": "Kanban",
    "nav.back": "Kembali",
    "nav.logout": "Log keluar",

    "prefs.language_region": "Bahasa & rantau",
    "prefs.language": "Bahasa",
    "prefs.timezone": "Zon masa",
    "prefs.appearance": "Paparan",
    "prefs.theme": "Tema",
    "prefs.save": "Simpan keutamaan",
    "prefs.discard": "Buang",

    "org.title": "Ruang kerja",
    "org.subtitle":
      "Cipta atau sertai ruang kerja. Buka untuk urus backlog dan tugasan bersama.",
    "org.quick": "Tindakan pantas",
    "org.go_kanban": "Pergi ke Kanban",
    "org.create": "Cipta ruang kerja",
    "org.join": "Sertai ruang kerja",
    "org.search": "Cari ruang kerja…",
    "org.sort": "Isih ruang kerja",
  },

  ta: {
    "nav.account": "கணக்கு",
    "nav.settings": "அமைப்புகள்",
    "nav.profile": "சுயவிவரம்",
    "nav.preferences": "விருப்பங்கள்",
    "nav.security": "பாதுகாப்பு",
    "nav.workspaces": "பணிமனை",
    "nav.kanban": "கன்பான்",
    "nav.back": "பின் செல்ல",
    "nav.logout": "வெளியேறு",

    "prefs.language_region": "மொழி & பகுதி",
    "prefs.language": "மொழி",
    "prefs.timezone": "நேர மண்டலம்",
    "prefs.appearance": "தோற்றம்",
    "prefs.theme": "தீம்",
    "prefs.save": "விருப்பங்களை சேமி",
    "prefs.discard": "நீக்கு",

    "org.title": "பணிமனைகள்",
    "org.subtitle":
      "பணிமனையை உருவாக்கவும் அல்லது சேரவும். பகிரப்பட்ட backlog மற்றும் பணிகளை நிர்வகிக்க திறக்கவும்.",
    "org.quick": "விரைவு செயல்கள்",
    "org.go_kanban": "கன்பானுக்கு செல்",
    "org.create": "பணிமனை உருவாக்கு",
    "org.join": "பணிமனையில் சேர",
    "org.search": "பணிமனை தேடு…",
    "org.sort": "பணிமனை வரிசைப்படுத்து",
  },
};

export function translate(locale, key) {
  const lang = DICTS[locale] ? locale : "en";
  return DICTS[lang]?.[key] ?? DICTS.en?.[key] ?? key;
}
