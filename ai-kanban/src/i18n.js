// src/i18n.js
export const DICTS = {
  en: {
    // Navigation
    "nav.account": "Account",
    "nav.settings": "Settings",
    "nav.profile": "Profile",
    "nav.preferences": "Preferences",
    "nav.security": "Security",
    "nav.workspaces": "Workspaces",
    "nav.kanban": "Kanban",
    "nav.back": "Back",
    "nav.logout": "Logout",

    // Preferences
    "prefs.language_region": "Language & Region",
    "prefs.language": "Language",
    "prefs.timezone": "Timezone",
    "prefs.appearance": "Appearance",
    "prefs.theme": "Theme",
    "prefs.save": "Save Preferences",
    "prefs.discard": "Discard Changes",

    // Profile
    "profile.info": "Profile Information",
    "profile.info.subtitle": "Your identity displayed across the system.",
    "profile.picture": "Profile Picture",
    "profile.picture.subtitle": "Upload a square image (recommended 512×512px, max 3MB).",
    "profile.user_id": "User ID",
    "profile.email": "Email Address",
    "profile.username": "Username",
    "profile.username.placeholder": "Enter your username",
    "profile.save_username": "Save Username",
    "profile.upload_image": "Upload Image",
    "profile.remove": "Remove",
    "profile.format": "PNG, JPG, or WEBP format",

    // Security
    "security.session": "Session Management",
    "security.session.subtitle": "View and control your active sessions.",
    "security.last_login": "Last Login",
    "security.account_created": "Account Created",
    "security.signout_others": "Sign Out Other Devices",
    "security.signout_all": "Terminate All Sessions",
    "security.password": "Password Management",
    "security.password.subtitle": "Reset your password via secure email verification.",
    "security.reset_email": "Send Password Reset Email",
    "security.reset_info": "You'll receive a secure password reset link in your registered email inbox. The link expires after 1 hour.",

    // Preferences detailed
    "prefs.reduce_motion": "Reduce Motion",
    "prefs.reduce_motion.desc": "Minimize animations for accessibility.",
    "prefs.inapp_notif": "In-App Notifications",
    "prefs.inapp_notif.desc": "Show alerts and updates within the application.",
    "prefs.email_notif": "Email Notifications",
    "prefs.email_notif.desc": "Receive important account notifications via email.",

    // Status messages
    "status.unsaved": "Unsaved",
    "status.saved": "Saved",
    "status.active": "Active",
    "status.draft": "Draft",
    "status.processing": "Processing...",
    "status.saving": "Saving...",
    "status.uploading": "Uploading...",
    "status.loading": "Loading your profile...",

    // Badges
    "badge.rsaf": "RSAF",
    "badge.encrypted": "Encrypted",
    "badge.standard": "Standard",
    "badge.system": "System",

    // Toast notifications
    "toast.username_saved": "Username saved successfully.",
    "toast.preferences_saved": "Settings updated successfully.",
    "toast.avatar_uploaded": "Profile picture uploaded successfully.",
    "toast.avatar_removed": "Profile picture removed.",
    "toast.changes_discarded": "Draft discarded.",
    "toast.preferences_reset": "Preferences reset.",
    "toast.reset_sent": "Check your inbox for password reset link.",
    "toast.sessions_terminated": "Signed out from other devices.",
    "toast.all_sessions_ended": "Redirecting to login...",

    // Errors
    "error.username_empty": "Username cannot be empty.",
    "error.invalid_file": "Please upload an image file.",
    "error.file_too_large": "Maximum file size is 3MB.",
    "error.no_email": "Account email is missing.",
    "error.system_error": "System Error",
    "error.reload": "Reload",

    // Modals
    "modal.confirm_signout": "Terminate All Sessions?",
    "modal.confirm_signout.subtitle": "This will end all active sessions including this one. You must log in again.",
    "modal.confirm_signout.desc": "If you suspect unauthorized access, sign out all devices immediately and reset your password. This action cannot be undone and will require you to log in again on all devices.",
    "modal.cancel": "Cancel",

    // Info boxes
    "info.storage": "Storage Information",
    "info.storage.desc": "Profile pictures are stored securely in Supabase Storage. File path:",
    "info.enterprise": "Enterprise Feature",
    "info.enterprise.desc": "Save button is disabled until changes are detected to prevent accidental writes and improve audit trail clarity.",
    "info.security": "Security Advisory",
    "info.security.desc": "For enterprise deployments, consider implementing comprehensive audit logs for session management, sign-out events, and password resets to maintain security compliance.",

    // Organization
    "org.title": "Workspaces",
    "org.subtitle": "Create or join a workspace. Open one to manage shared backlog and tasks.",
    "org.quick": "Quick actions",
    "org.go_kanban": "Go to Kanban",
    "org.create": "Create workspace",
    "org.join": "Join workspace",
    "org.search": "Search workspaces…",
    "org.sort": "Sort workspaces",
  },

  zh: {
    // Navigation
    "nav.account": "账户",
    "nav.settings": "设置",
    "nav.profile": "个人资料",
    "nav.preferences": "偏好设置",
    "nav.security": "安全",
    "nav.workspaces": "工作区",
    "nav.kanban": "看板",
    "nav.back": "返回",
    "nav.logout": "登出",

    // Preferences
    "prefs.language_region": "语言与地区",
    "prefs.language": "语言",
    "prefs.timezone": "时区",
    "prefs.appearance": "外观",
    "prefs.theme": "主题",
    "prefs.save": "保存偏好",
    "prefs.discard": "放弃更改",

    // Profile
    "profile.info": "个人信息",
    "profile.info.subtitle": "您在系统中显示的身份。",
    "profile.picture": "头像",
    "profile.picture.subtitle": "上传正方形图片（建议512×512像素，最大3MB）。",
    "profile.user_id": "用户ID",
    "profile.email": "电子邮箱",
    "profile.username": "用户名",
    "profile.username.placeholder": "输入您的用户名",
    "profile.save_username": "保存用户名",
    "profile.upload_image": "上传图片",
    "profile.remove": "移除",
    "profile.format": "PNG、JPG或WEBP格式",

    // Security
    "security.session": "会话管理",
    "security.session.subtitle": "查看和控制您的活跃会话。",
    "security.last_login": "上次登录",
    "security.account_created": "账户创建时间",
    "security.signout_others": "登出其他设备",
    "security.signout_all": "终止所有会话",
    "security.password": "密码管理",
    "security.password.subtitle": "通过安全邮件验证重置密码。",
    "security.reset_email": "发送密码重置邮件",
    "security.reset_info": "您将在注册邮箱中收到安全的密码重置链接。链接将在1小时后过期。",

    // Preferences detailed
    "prefs.reduce_motion": "减少动画",
    "prefs.reduce_motion.desc": "为无障碍访问最小化动画。",
    "prefs.inapp_notif": "应用内通知",
    "prefs.inapp_notif.desc": "在应用中显示警报和更新。",
    "prefs.email_notif": "邮件通知",
    "prefs.email_notif.desc": "通过邮件接收重要账户通知。",

    // Status messages
    "status.unsaved": "未保存",
    "status.saved": "已保存",
    "status.active": "活跃",
    "status.draft": "草稿",
    "status.processing": "处理中...",
    "status.saving": "保存中...",
    "status.uploading": "上传中...",
    "status.loading": "正在加载您的资料...",

    // Badges
    "badge.rsaf": "RSAF",
    "badge.encrypted": "已加密",
    "badge.standard": "标准",
    "badge.system": "系统",

    // Toast notifications
    "toast.username_saved": "用户名保存成功。",
    "toast.preferences_saved": "设置更新成功。",
    "toast.avatar_uploaded": "头像上传成功。",
    "toast.avatar_removed": "头像已移除。",
    "toast.changes_discarded": "草稿已丢弃。",
    "toast.preferences_reset": "偏好设置已重置。",
    "toast.reset_sent": "请检查您的收件箱获取密码重置链接。",
    "toast.sessions_terminated": "已从其他设备登出。",
    "toast.all_sessions_ended": "正在跳转到登录页面...",

    // Errors
    "error.username_empty": "用户名不能为空。",
    "error.invalid_file": "请上传图片文件。",
    "error.file_too_large": "文件最大为3MB。",
    "error.no_email": "账户邮箱缺失。",
    "error.system_error": "系统错误",
    "error.reload": "重新加载",

    // Modals
    "modal.confirm_signout": "终止所有会话？",
    "modal.confirm_signout.subtitle": "这将结束包括当前在内的所有活跃会话。您必须重新登录。",
    "modal.confirm_signout.desc": "如果您怀疑有未授权访问，请立即登出所有设备并重置密码。此操作无法撤销，需要您在所有设备上重新登录。",
    "modal.cancel": "取消",

    // Info boxes
    "info.storage": "存储信息",
    "info.storage.desc": "头像安全存储在Supabase Storage中。文件路径：",
    "info.enterprise": "企业功能",
    "info.enterprise.desc": "在检测到更改之前保存按钮被禁用，以防止意外写入并提高审计追踪清晰度。",
    "info.security": "安全建议",
    "info.security.desc": "对于企业部署，建议实施全面的审计日志来记录会话管理、登出事件和密码重置，以保持安全合规性。",

    // Organization
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
    // Navigation
    "nav.account": "Akaun",
    "nav.settings": "Tetapan",
    "nav.profile": "Profil",
    "nav.preferences": "Keutamaan",
    "nav.security": "Keselamatan",
    "nav.workspaces": "Ruang kerja",
    "nav.kanban": "Kanban",
    "nav.back": "Kembali",
    "nav.logout": "Log keluar",

    // Preferences
    "prefs.language_region": "Bahasa & rantau",
    "prefs.language": "Bahasa",
    "prefs.timezone": "Zon masa",
    "prefs.appearance": "Paparan",
    "prefs.theme": "Tema",
    "prefs.save": "Simpan keutamaan",
    "prefs.discard": "Buang",

    // Profile
    "profile.info": "Maklumat Profil",
    "profile.info.subtitle": "Identiti anda yang dipaparkan di seluruh sistem.",
    "profile.picture": "Gambar Profil",
    "profile.picture.subtitle": "Muat naik gambar segi empat sama (disyorkan 512×512px, maks 3MB).",
    "profile.user_id": "ID Pengguna",
    "profile.email": "Alamat E-mel",
    "profile.username": "Nama Pengguna",
    "profile.username.placeholder": "Masukkan nama pengguna anda",
    "profile.save_username": "Simpan Nama Pengguna",
    "profile.upload_image": "Muat Naik Gambar",
    "profile.remove": "Buang",
    "profile.format": "Format PNG, JPG, atau WEBP",

    // Security
    "security.session": "Pengurusan Sesi",
    "security.session.subtitle": "Lihat dan kawal sesi aktif anda.",
    "security.last_login": "Log Masuk Terakhir",
    "security.account_created": "Akaun Dicipta",
    "security.signout_others": "Log Keluar Peranti Lain",
    "security.signout_all": "Tamatkan Semua Sesi",
    "security.password": "Pengurusan Kata Laluan",
    "security.password.subtitle": "Set semula kata laluan anda melalui pengesahan e-mel yang selamat.",
    "security.reset_email": "Hantar E-mel Set Semula Kata Laluan",
    "security.reset_info": "Anda akan menerima pautan set semula kata laluan yang selamat dalam peti masuk e-mel berdaftar anda. Pautan ini akan tamat tempoh selepas 1 jam.",

    // Preferences detailed
    "prefs.reduce_motion": "Kurangkan Pergerakan",
    "prefs.reduce_motion.desc": "Minimumkan animasi untuk kebolehcapaian.",
    "prefs.inapp_notif": "Pemberitahuan Dalam Aplikasi",
    "prefs.inapp_notif.desc": "Tunjukkan makluman dan kemas kini dalam aplikasi.",
    "prefs.email_notif": "Pemberitahuan E-mel",
    "prefs.email_notif.desc": "Terima pemberitahuan akaun penting melalui e-mel.",

    // Status messages
    "status.unsaved": "Belum Disimpan",
    "status.saved": "Disimpan",
    "status.active": "Aktif",
    "status.draft": "Draf",
    "status.processing": "Memproses...",
    "status.saving": "Menyimpan...",
    "status.uploading": "Memuat naik...",
    "status.loading": "Memuatkan profil anda...",

    // Badges
    "badge.rsaf": "RSAF",
    "badge.encrypted": "Disulitkan",
    "badge.standard": "Standard",
    "badge.system": "Sistem",

    // Toast notifications
    "toast.username_saved": "Nama pengguna berjaya disimpan.",
    "toast.preferences_saved": "Tetapan berjaya dikemas kini.",
    "toast.avatar_uploaded": "Gambar profil berjaya dimuat naik.",
    "toast.avatar_removed": "Gambar profil dibuang.",
    "toast.changes_discarded": "Draf dibuang.",
    "toast.preferences_reset": "Keutamaan ditetapkan semula.",
    "toast.reset_sent": "Semak peti masuk anda untuk pautan set semula kata laluan.",
    "toast.sessions_terminated": "Log keluar dari peranti lain.",
    "toast.all_sessions_ended": "Mengubah hala ke log masuk...",

    // Errors
    "error.username_empty": "Nama pengguna tidak boleh kosong.",
    "error.invalid_file": "Sila muat naik fail gambar.",
    "error.file_too_large": "Saiz fail maksimum ialah 3MB.",
    "error.no_email": "E-mel akaun tiada.",
    "error.system_error": "Ralat Sistem",
    "error.reload": "Muat Semula",

    // Modals
    "modal.confirm_signout": "Tamatkan Semua Sesi?",
    "modal.confirm_signout.subtitle": "Ini akan menamatkan semua sesi aktif termasuk yang ini. Anda mesti log masuk semula.",
    "modal.confirm_signout.desc": "Jika anda mengesyaki akses tanpa kebenaran, log keluar semua peranti dengan segera dan set semula kata laluan anda. Tindakan ini tidak boleh dibuat asal dan memerlukan anda log masuk semula pada semua peranti.",
    "modal.cancel": "Batal",

    // Info boxes
    "info.storage": "Maklumat Penyimpanan",
    "info.storage.desc": "Gambar profil disimpan dengan selamat di Supabase Storage. Laluan fail:",
    "info.enterprise": "Ciri Perusahaan",
    "info.enterprise.desc": "Butang simpan dilumpuhkan sehingga perubahan dikesan untuk mengelakkan penulisan tidak sengaja dan meningkatkan kejelasan jejak audit.",
    "info.security": "Nasihat Keselamatan",
    "info.security.desc": "Untuk penggunaan perusahaan, pertimbangkan untuk melaksanakan log audit komprehensif untuk pengurusan sesi, acara log keluar, dan set semula kata laluan untuk mengekalkan pematuhan keselamatan.",

    // Organization
    "org.title": "Ruang kerja",
    "org.subtitle": "Cipta atau sertai ruang kerja. Buka untuk urus backlog dan tugasan bersama.",
    "org.quick": "Tindakan pantas",
    "org.go_kanban": "Pergi ke Kanban",
    "org.create": "Cipta ruang kerja",
    "org.join": "Sertai ruang kerja",
    "org.search": "Cari ruang kerja…",
    "org.sort": "Isih ruang kerja",
  },

  ta: {
    // Navigation
    "nav.account": "கணக்கு",
    "nav.settings": "அமைப்புகள்",
    "nav.profile": "சுயவிவரம்",
    "nav.preferences": "விருப்பங்கள்",
    "nav.security": "பாதுகாப்பு",
    "nav.workspaces": "பணிமனை",
    "nav.kanban": "கன்பான்",
    "nav.back": "பின் செல்ல",
    "nav.logout": "வெளியேறு",

    // Preferences
    "prefs.language_region": "மொழி & பகுதி",
    "prefs.language": "மொழி",
    "prefs.timezone": "நேர மண்டலம்",
    "prefs.appearance": "தோற்றம்",
    "prefs.theme": "தீம்",
    "prefs.save": "விருப்பங்களை சேமி",
    "prefs.discard": "நீக்கு",

    // Profile
    "profile.info": "சுயவிவர தகவல்",
    "profile.info.subtitle": "அமைப்பு முழுவதும் காட்டப்படும் உங்கள் அடையாளம்.",
    "profile.picture": "சுயவிவர படம்",
    "profile.picture.subtitle": "சதுர படத்தை பதிவேற்றவும் (பரிந்துரைக்கப்பட்டது 512×512px, அதிகபட்சம் 3MB).",
    "profile.user_id": "பயனர் ID",
    "profile.email": "மின்னஞ்சல் முகவரி",
    "profile.username": "பயனர் பெயர்",
    "profile.username.placeholder": "உங்கள் பயனர் பெயரை உள்ளிடவும்",
    "profile.save_username": "பயனர் பெயரை சேமி",
    "profile.upload_image": "படத்தை பதிவேற்று",
    "profile.remove": "நீக்கு",
    "profile.format": "PNG, JPG, அல்லது WEBP வடிவம்",

    // Security
    "security.session": "அமர்வு நிர்வாகம்",
    "security.session.subtitle": "உங்கள் செயலில் உள்ள அமர்வுகளை பார்க்கவும் கட்டுப்படுத்தவும்.",
    "security.last_login": "கடைசி உள்நுழைவு",
    "security.account_created": "கணக்கு உருவாக்கப்பட்டது",
    "security.signout_others": "பிற சாதனங்களில் இருந்து வெளியேறு",
    "security.signout_all": "அனைத்து அமர்வுகளையும் முடிக்கவும்",
    "security.password": "கடவுச்சொல் நிர்வாகம்",
    "security.password.subtitle": "பாதுகாப்பான மின்னஞ்சல் சரிபார்ப்பு மூலம் உங்கள் கடவுச்சொல்லை மீட்டமைக்கவும்.",
    "security.reset_email": "கடவுச்சொல் மீட்டமைப்பு மின்னஞ்சலை அனுப்பு",
    "security.reset_info": "பதிவுசெய்யப்பட்ட மின்னஞ்சல் பெட்டியில் பாதுகாப்பான கடவுச்சொல் மீட்டமைப்பு இணைப்பைப் பெறுவீர்கள். இணைப்பு 1 மணி நேரத்திற்குப் பிறகு காலாவதியாகிவிடும்.",

    // Preferences detailed
    "prefs.reduce_motion": "இயக்கத்தை குறைக்கவும்",
    "prefs.reduce_motion.desc": "அணுகல்தன்மைக்காக அசைவூட்டங்களை குறைக்கவும்.",
    "prefs.inapp_notif": "பயன்பாட்டு அறிவிப்புகள்",
    "prefs.inapp_notif.desc": "பயன்பாட்டுக்குள் எச்சரிக்கைகள் மற்றும் புதுப்பிப்புகளை காட்டு.",
    "prefs.email_notif": "மின்னஞ்சல் அறிவிப்புகள்",
    "prefs.email_notif.desc": "முக்கிய கணக்கு அறிவிப்புகளை மின்னஞ்சல் மூலம் பெறவும்.",

    // Status messages
    "status.unsaved": "சேமிக்கப்படவில்லை",
    "status.saved": "சேமிக்கப்பட்டது",
    "status.active": "செயலில்",
    "status.draft": "வரைவு",
    "status.processing": "செயலாக்கப்படுகிறது...",
    "status.saving": "சேமிக்கப்படுகிறது...",
    "status.uploading": "பதிவேற்றப்படுகிறது...",
    "status.loading": "உங்கள் சுயவிவரம் ஏற்றப்படுகிறது...",

    // Badges
    "badge.rsaf": "RSAF",
    "badge.encrypted": "குறியாக்கம்",
    "badge.standard": "தரநிலை",
    "badge.system": "அமைப்பு",

    // Toast notifications
    "toast.username_saved": "பயனர் பெயர் வெற்றிகரமாக சேமிக்கப்பட்டது.",
    "toast.preferences_saved": "அமைப்புகள் வெற்றிகரமாக புதுப்பிக்கப்பட்டன.",
    "toast.avatar_uploaded": "சுயவிவர படம் வெற்றிகரமாக பதிவேற்றப்பட்டது.",
    "toast.avatar_removed": "சுயவிவர படம் நீக்கப்பட்டது.",
    "toast.changes_discarded": "வரைவு நிராகரிக்கப்பட்டது.",
    "toast.preferences_reset": "விருப்பங்கள் மீட்டமைக்கப்பட்டன.",
    "toast.reset_sent": "கடவுச்சொல் மீட்டமைப்பு இணைப்புக்கு உங்கள் அஞ்சல் பெட்டியை சரிபார்க்கவும்.",
    "toast.sessions_terminated": "பிற சாதனங்களில் இருந்து வெளியேறினீர்கள்.",
    "toast.all_sessions_ended": "உள்நுழைவுக்கு திருப்பி விடப்படுகிறது...",

    // Errors
    "error.username_empty": "பயனர் பெயர் காலியாக இருக்க முடியாது.",
    "error.invalid_file": "தயவுசெய்து படக் கோப்பைப் பதிவேற்றவும்.",
    "error.file_too_large": "அதிகபட்ச கோப்பு அளவு 3MB.",
    "error.no_email": "கணக்கு மின்னஞ்சல் காணவில்லை.",
    "error.system_error": "அமைப்பு பிழை",
    "error.reload": "மீண்டும் ஏற்று",

    // Modals
    "modal.confirm_signout": "அனைத்து அமர்வுகளையும் முடிக்கவா?",
    "modal.confirm_signout.subtitle": "இது இதுவும் உட்பட அனைத்து செயலில் உள்ள அமர்வுகளையும் முடிக்கும். நீங்கள் மீண்டும் உள்நுழைய வேண்டும்.",
    "modal.confirm_signout.desc": "அங்கீகரிக்கப்படாத அணுகலை சந்தேகித்தால், உடனடியாக அனைத்து சாதனங்களிலிருந்தும் வெளியேறி உங்கள் கடவுச்சொல்லை மீட்டமைக்கவும். இந்த செயலை செயல்தவிர்க்க முடியாது மற்றும் அனைத்து சாதனங்களிலும் மீண்டும் உள்நுழைய வேண்டும்.",
    "modal.cancel": "ரத்து செய்",

    // Info boxes
    "info.storage": "சேமிப்பக தகவல்",
    "info.storage.desc": "சுயவிவர படங்கள் Supabase Storage இல் பாதுகாப்பாக சேமிக்கப்படுகின்றன. கோப்பு பாதை:",
    "info.enterprise": "நிறுவன அம்சம்",
    "info.enterprise.desc": "தற்செயலான எழுத்துக்களை தடுக்கவும் தணிக்கை பாதையின் தெளிவை மேம்படுத்தவும் மாற்றங்கள் கண்டறியப்படும் வரை சேமி பொத்தான் முடக்கப்பட்டுள்ளது.",
    "info.security": "பாதுகாப்பு ஆலோசனை",
    "info.security.desc": "நிறுவன பயன்பாட்டிற்கு, பாதுகாப்பு இணக்கத்தை பராமரிக்க அமர்வு நிர்வாகம், வெளியேற்ற நிகழ்வுகள் மற்றும் கடவுச்சொல் மீட்டமைப்புகளுக்கான விரிவான தணிக்கை பதிவுகளை செயல்படுத்துவதை பரிசீலிக்கவும்.",

    // Organization
    "org.title": "பணிமனைகள்",
    "org.subtitle": "பணிமனையை உருவாக்கவும் அல்லது சேரவும். பகிரப்பட்ட backlog மற்றும் பணிகளை நிர்வகிக்க திறக்கவும்.",
    "org.quick": "விரைவு செயல்கள்",
    "org.go_kanban": "கன்பானுக்கு செல்",
    "org.create": "பணிமனை உருவாக்கு",
    "org.join": "பணிமனையில் சேர",
    "org.search": "பணிமனை தேடு…",
    "org.sort": "பணிமனை வரிசைப்படுத்து",
  },
};

/**
 * Translate a key into the current locale
 * @param {string} locale - Current locale (en, zh, ms, ta)
 * @param {string} key - Translation key (e.g., "nav.account")
 * @returns {string} - Translated string or the key itself as fallback
 */
export function translate(locale, key) {
  // Fallback to English if locale not found
  const lang = DICTS[locale] ? locale : "en";
  
  // Return translation or fallback to English or key itself
  return DICTS[lang]?.[key] ?? DICTS.en?.[key] ?? key;
}