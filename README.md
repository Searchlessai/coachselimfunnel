# Funnel أحمد سليم — دليل التشغيل والتبديل

موقع Funnel كوتشنج بتصميم أسود/ذهبي، عربي بالكامل، موبايل أولاً، ملف واحد `index.html`
جاهز للرفع على **GitHub Pages** (أو أي استضافة static).

## بنية الملفات
```
index.html    كل الموقع: الصفحات (home/booked/privacy/terms/disclaimer) بنظام hash routing + الستايل + السكربتات
_redirects    خاص بـ Netlify فقط — لا تأثير له على GitHub Pages (التنقّل يتم بالـ hash)
```

## أماكن التبديل المطلوبة قبل النشر

| ماذا تبدّل | أين في `index.html` | القيمة الحالية (Placeholder) |
|---|---|---|
| **فيديو صفحة 1 (Wistia)** | سطر الـ iframe في الهيرو | `MEDIA_ID` داخل `fast.wistia.net/embed/iframe/MEDIA_ID` |
| **رابط استقبال البيانات** | أعلى قسم السكربت | `SHEETS_WEBAPP_URL` |
| **فيديو صفحة 2 (يوتيوب)** | iframe صفحة booked | `NEXT_STEPS_VIDEO_ID` |
| **صور قبل/بعد** | قسم النتائج | روابط الصور |

رابط الحجز (Calendly) مضبوط بالفعل: ودجت مدمج تحت الفورم + زر في صفحة booked
على `https://calendly.com/ahmedselimofficialfit/20min`.

## تدفق البيانات (مجاني بالكامل)

```
الفورم → Google Apps Script Web App → Google Sheet → Zapier (خطوتان) → إشعار Slack
```

- الكتابة في Google Sheet تتم مباشرة عبر Apps Script (مجاني — لا يستهلك مهام Zapier).
- Zapier المجاني يُستخدم فقط للإشعار: كل عميل = مهمة واحدة → 100 عميل/شهر ضمن الحد المجاني.
- **لا نستخدم Webhooks by Zapier** لأنه تطبيق Premium غير متاح في الخطة المجانية.

### الخطوة 1: Google Sheet + Apps Script

1. أنشئ Google Sheet جديد (سمِّه مثلاً «Leads أحمد سليم»).
2. من القائمة: **Extensions ← Apps Script**، امسح الكود الموجود والصق:

```js
var SHEET_NAME = 'Leads';
var HEADERS = ['timestamp', 'name', 'email', 'phone', 'goal', 'trainingDuration',
    'monthlyBudget', 'pedHistory', 'pedDetails', 'commitment', 'pageUrl',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];

function doPost(e) {
    var data = {};
    try { data = JSON.parse(e.postData.contents); } catch (err) {}
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    sheet.appendRow(HEADERS.map(function (h) { return data[h] || ''; }));
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
        .setMimeType(ContentService.MimeType.JSON);
}
```

3. **Deploy ← New deployment ← Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. انسخ رابط الـ Web app (بيبدأ بـ `https://script.google.com/macros/s/...`)
   وحطه مكان `SHEETS_WEBAPP_URL` في `index.html`.

> ملاحظة: عند أي تعديل لاحق في كود Apps Script لازم تعمل **New deployment** جديد
> (أو Manage deployments ← Edit ← New version) عشان التعديل يشتغل.

### الخطوة 2: Zapier (إشعار Slack)

Zap واحد من خطوتين (متاح في الخطة المجانية):

1. **Trigger:** Google Sheets ← *New Spreadsheet Row* ← اختر الشيت وتبويب `Leads`.
2. **Action:** Slack ← *Send Channel Message* ← اختر القناة وصِغ الرسالة من حقول الصف
   (مثلاً: «🔥 عميل جديد: {{name}} — {{phone}} — الهدف: {{goal}} — الميزانية: {{monthlyBudget}}»).

> الخطة المجانية بتعمل فحص (Polling) كل 15 دقيقة، فإشعار Slack ممكن يتأخر لحد ربع ساعة
> عن لحظة التسجيل. البيانات نفسها بتوصل الشيت فورًا.

### ملاحظة تقنية عن الإرسال
النموذج يرسل بـ `mode: 'no-cors'` (بدون هيدر JSON — المتصفح يبعته `text/plain`
وApps Script يقرأه من `e.postData.contents`). المتصفح لا يقرأ الرد، والانتقال لصفحة
booked يتم في كل الأحوال. البيانات المرسلة: كل حقول النموذج + كل الـ UTM + رابط الصفحة + الوقت.

## تتبّع الحملات (UTM)
عند فتح الرابط بمعاملات مثل `?utm_source=fb&utm_campaign=x`، تُلتقط تلقائيًا، تُحفظ في المتصفح،
تُلحق بروابط الفوتر، وتُرسل مع بيانات النموذج.

## معاينة محلية
من جذر المشروع:
```
npx serve
```
ثم افتح الرابط الظاهر.
