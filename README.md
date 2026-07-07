# Funnel أحمد سليم — دليل التشغيل والتبديل

موقع Funnel كوتشنج بتصميم أسود/ذهبي، عربي بالكامل، موبايل أولاً، جاهز للرفع على **Netlify**
(اسحب مجلد المشروع بالكامل في Netlify Drop).

## بنية الملفات
```
index.html        صفحة 1: هيرو + فيديو Wistia + أسئلة (سؤال لكل شاشة) + قبل/بعد + فوتر
booked.html       صفحة 2: فيديو (مصدر مختلف) + نص للعميل + خطوات + فوتر
privacy.html      سياسة الخصوصية
terms.html        الشروط والأحكام
disclaimer.html   إخلاء المسؤولية + الإقرارات الطبية
_redirects        روابط نظيفة على Netlify (/booked, /privacy ...)
assets/css/main.css   كل الستايل
assets/js/main.js     كل السكربتات (UTM + الأسئلة + سلايدر قبل/بعد + FAQ)
assets/images/        صور قبل/بعد
```

## أماكن التبديل المطلوبة قبل النشر

| ماذا تبدّل | أين | القيمة الحالية (Placeholder) |
|---|---|---|
| **فيديو صفحة 1 (Wistia)** | `index.html` — سطر الـ iframe | `MEDIA_ID` داخل الرابط `fast.wistia.net/embed/iframe/MEDIA_ID` |
| **رابط Zapier Webhook** | `assets/js/main.js` — أعلى الملف | `ZAPIER_WEBHOOK_URL` |
| **فيديو صفحة 2 (يوتيوب)** | `booked.html` — سطر الـ iframe | `NEXT_STEPS_VIDEO_ID` |
| **رابط الحجز (Calendly)** | `booked.html` — زر «احجز مكالمتك» | `CALENDLY_LINK` |
| **صور قبل/بعد** | `assets/images/` | `before-1.jpg` / `after-1.jpg` ... حتى 3 |

### 1) فيديو Wistia (صفحة 1)
في `index.html` استبدل `MEDIA_ID`:
```html
<iframe src="https://fast.wistia.net/embed/iframe/xxxxxx?videoFoam=true" ...></iframe>
```
(الـ `xxxxxx` هو معرّف الفيديو من لوحة Wistia.)

### 2) رابط Zapier
في `assets/js/main.js`:
```js
var ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/xxxx/yyyy/';
```
> النموذج يرسل بـ `mode: 'no-cors'`، فالمتصفح لا يقرأ ردّ Zapier — هذا طبيعي، والانتقال لصفحة
> booked يتم في كل الأحوال. البيانات المرسلة: كل حقول النموذج + كل الـ UTM + رابط الصفحة + الوقت.

### 3) فيديو صفحة 2
في `booked.html` استبدل `NEXT_STEPS_VIDEO_ID` بمعرّف فيديو يوتيوب (الجزء اللي بعد `watch?v=`).

### 4) رابط الحجز
في `booked.html` استبدل `CALENDLY_LINK` برابط Calendly أو أي أداة حجز.

### 5) صور قبل/بعد
ضع الصور الحقيقية في `assets/images/` بنفس الأسماء:
`before-1.jpg`, `after-1.jpg`, `before-2.jpg`, `after-2.jpg`, `before-3.jpg`, `after-3.jpg`.
يفضّل أن تكون كل صورتين (قبل/بعد) بنفس المقاس والزاوية لأفضل تأثير للسلايدر.

## تتبّع الحملات (UTM)
عند فتح الرابط بمعاملات مثل `?utm_source=fb&utm_campaign=x`، تُلتقط تلقائيًا، تُحفظ في المتصفح،
تُلحق بروابط الفوتر، وتُرسل مع بيانات النموذج، وتُمرّر لصفحة booked.

## معاينة محلية
من جذر المشروع:
```
npx serve
```
ثم افتح الرابط الظاهر. (ملاحظة: `_redirects` يعمل على Netlify فقط؛ محليًا استخدم روابط `.html`
المباشرة، وهي مضبوطة كذلك في كل الصفحات.)
