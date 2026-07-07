/* ==========================================================================
   أحمد سليم — Funnel كوتشنج | منطق مشترك (vanilla JS، بدون مكتبات)
   - التقاط UTM وتخزينه وتمريره
   - Wizard الأسئلة (سؤال واحد لكل شاشة + شريط تقدّم + تحقّق)
   - سلايدر before/after داخل كاروسيل
   - أكورديون الأسئلة الشائعة (FAQ)
   ========================================================================== */

/* ---------------- إعدادات قابلة للتبديل ---------------- */
// استبدل هذا الرابط برابط Zapier Webhook الحقيقي
var ZAPIER_WEBHOOK_URL = 'ZAPIER_WEBHOOK_URL';

/* =======================================================
   1) التقاط UTM وتخزينه في sessionStorage وتمريره للروابط
   ======================================================= */
var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];

function captureUTM() {
    var params = new URLSearchParams(window.location.search);
    UTM_KEYS.forEach(function (key) {
        var val = params.get(key);
        if (val) {
            try { sessionStorage.setItem(key, val); } catch (e) {}
        }
    });
}

function getStoredUTM() {
    var data = {};
    UTM_KEYS.forEach(function (key) {
        var val = '';
        try { val = sessionStorage.getItem(key) || ''; } catch (e) {}
        data[key] = val;
    });
    return data;
}

function utmQueryString() {
    var utm = getStoredUTM();
    var parts = [];
    UTM_KEYS.forEach(function (key) {
        if (utm[key]) parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(utm[key]));
    });
    return parts.join('&');
}

// إلحاق الـ UTM بالروابط الداخلية (نفس الموقع)
function appendUTMToInternalLinks() {
    var qs = utmQueryString();
    if (!qs) return;
    document.querySelectorAll('a[href]').forEach(function (a) {
        var href = a.getAttribute('href');
        if (!href || href.charAt(0) === '#') return;
        // روابط خارجية أو mailto/tel نتجاهلها
        if (/^(https?:)?\/\//i.test(href) && href.indexOf(window.location.host) === -1) return;
        if (/^(mailto:|tel:)/i.test(href)) return;
        a.setAttribute('href', href + (href.indexOf('?') === -1 ? '?' : '&') + qs);
    });
}

/* =======================================================
   2) Wizard الأسئلة
   ======================================================= */
function initWizard() {
    var wizard = document.getElementById('wizard');
    if (!wizard) return;

    var steps = Array.prototype.slice.call(wizard.querySelectorAll('.wizard-step'));
    var progressFill = document.getElementById('progressFill');
    var stepCount = document.getElementById('stepCount');
    var backBtn = document.getElementById('backBtn');
    var nextBtn = document.getElementById('nextBtn');
    var nextLabel = nextBtn.querySelector('.btn-label');
    var nextArrow = nextBtn.querySelector('.btn-arrow');
    var form = document.getElementById('leadForm');

    var current = 0;

    // الخطوات المرئية فعليًا (بعض الخطوات شرطية مثل تفاصيل السايكل)
    function visibleSteps() {
        return steps.filter(function (s) { return s.dataset.skip !== 'true'; });
    }

    function showStep(index) {
        var vis = visibleSteps();
        if (index < 0) index = 0;
        if (index >= vis.length) index = vis.length - 1;
        current = index;

        steps.forEach(function (s) { s.classList.remove('active'); });
        vis[current].classList.add('active');

        // شريط التقدّم + العدّاد
        var total = vis.length;
        var pct = Math.round(((current + 1) / total) * 100);
        progressFill.style.width = pct + '%';
        stepCount.textContent = 'خطوة ' + (current + 1) + ' من ' + total;

        // أزرار التنقّل
        var isLast = current === total - 1;
        backBtn.style.display = current === 0 ? 'none' : '';
        nextLabel.textContent = isLast ? 'أرسل طلبي الآن' : 'التالي';
        if (nextArrow) nextArrow.style.display = isLast ? 'none' : '';

        // ركّز على أول حقل نصّي
        var input = vis[current].querySelector('input.field, textarea.field');
        if (input) setTimeout(function () { input.focus(); }, 60);
    }

    // اختيار من أزرار الخيارات
    wizard.addEventListener('click', function (e) {
        var btn = e.target.closest('.option-btn');
        if (!btn) return;
        var step = btn.closest('.wizard-step');
        step.querySelectorAll('.option-btn').forEach(function (b) { b.classList.remove('selected'); });
        btn.classList.add('selected');

        var hiddenName = step.dataset.field;
        var hidden = form.querySelector('input[name="' + hiddenName + '"]');
        if (hidden) hidden.value = btn.dataset.value;

        clearError(step);

        // منطق شرطي: تفاصيل محسّنات الأداء تظهر فقط عند "نعم"
        if (hiddenName === 'pedHistory') {
            var pedStep = document.querySelector('.wizard-step[data-field="pedDetails"]');
            if (pedStep) pedStep.dataset.skip = (btn.dataset.value === 'نعم') ? 'false' : 'true';
        }

        // تقدّم تلقائي بعد اختيار (تجربة أسرع على الموبايل)
        setTimeout(function () { goNext(); }, 250);
    });

    function validateStep(step) {
        clearError(step);
        var field = step.dataset.field;

        // خطوات نصّية مطلوبة
        var input = step.querySelector('input.field, textarea.field');
        if (input && input.dataset.required === 'true') {
            var val = input.value.trim();
            if (!val) { showError(step, 'من فضلك املأ هذه الخانة عشان نكمل'); return false; }
            if (input.type === 'email') {
                var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!re.test(val)) { showError(step, 'اكتب بريدًا إلكترونيًا صحيحًا'); return false; }
            }
        }

        // خطوات اختيار مطلوبة
        if (step.dataset.required === 'true' && step.querySelector('.options')) {
            var hidden = form.querySelector('input[name="' + field + '"]');
            if (!hidden || !hidden.value) { showError(step, 'اختر إجابة عشان نكمل'); return false; }
        }
        return true;
    }

    function showError(step, msg) {
        var el = step.querySelector('.error-message');
        if (el) { el.textContent = msg; el.classList.add('show'); }
    }

    function clearError(step) {
        var el = step.querySelector('.error-message');
        if (el) el.classList.remove('show');
    }

    function goNext() {
        var vis = visibleSteps();
        var step = vis[current];
        if (!validateStep(step)) return;

        if (current === vis.length - 1) {
            submitForm();
        } else {
            showStep(current + 1);
        }
    }

    function goBack() { showStep(current - 1); }

    nextBtn.addEventListener('click', goNext);
    backBtn.addEventListener('click', goBack);

    // Enter في الحقول النصّية = التالي
    wizard.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
            goNext();
        }
    });

    function collectData() {
        var data = {};
        form.querySelectorAll('input[name], textarea[name]').forEach(function (el) {
            data[el.name] = el.value;
        });
        var utm = getStoredUTM();
        UTM_KEYS.forEach(function (k) { data[k] = utm[k]; });
        data.pageUrl = window.location.href;
        data.timestamp = new Date().toISOString();
        return data;
    }

    function submitForm() {
        nextBtn.disabled = true;
        nextLabel.textContent = 'جارٍ الإرسال...';
        if (nextArrow) nextArrow.style.display = 'none';

        var payload = collectData();

        fetch(ZAPIER_WEBHOOK_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function () {
            redirectToBooked();
        }).catch(function () {
            // مع no-cors مفيش استجابة نقرأها؛ نكمّل للصفحة التالية في كل الأحوال
            redirectToBooked();
        });
    }

    function redirectToBooked() {
        var qs = utmQueryString();
        window.location.href = 'booked.html' + (qs ? ('?' + qs) : '');
    }

    showStep(0);
}

/* =======================================================
   3) سلايدر before/after (سحب) + كاروسيل
   ======================================================= */
function initCompareSliders() {
    document.querySelectorAll('.compare').forEach(function (cmp) {
        var beforeImg = cmp.querySelector('.img-before');
        var handle = cmp.querySelector('.handle');

        function setPos(clientX) {
            var rect = cmp.getBoundingClientRect();
            // RTL: نقيس من جهة اليمين. "قبل" على اليمين، والمقبض يتبع المؤشّر.
            // clip-path مستقل عن ظهور الشريحة، فبيشتغل صح على كل الشرائح.
            var p = Math.max(0, Math.min(100, ((rect.right - clientX) / rect.width) * 100));
            beforeImg.style.clipPath = 'inset(0 0 0 ' + (100 - p) + '%)';
            handle.style.right = p + '%';
        }

        var dragging = false;
        function start(e) { dragging = true; move(e); }
        function stop() { dragging = false; }
        function move(e) {
            if (!dragging) return;
            var clientX = e.touches ? e.touches[0].clientX : e.clientX;
            setPos(clientX);
            if (e.cancelable) e.preventDefault();
        }

        cmp.addEventListener('mousedown', start);
        window.addEventListener('mouseup', stop);
        window.addEventListener('mousemove', move);
        cmp.addEventListener('touchstart', start, { passive: false });
        window.addEventListener('touchend', stop);
        cmp.addEventListener('touchmove', move, { passive: false });
    });
}

function initCarousel() {
    var carousel = document.getElementById('carousel');
    if (!carousel) return;

    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.slide'));
    var dotsWrap = carousel.querySelector('.carousel-dots');
    var prev = carousel.querySelector('.carousel-arrow.prev');
    var next = carousel.querySelector('.carousel-arrow.next');
    var index = 0;

    slides.forEach(function (_, i) {
        var dot = document.createElement('span');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', function () { show(i); });
        dotsWrap.appendChild(dot);
    });
    var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('.dot'));

    function show(i) {
        index = (i + slides.length) % slides.length;
        slides.forEach(function (s, k) { s.classList.toggle('active', k === index); });
        dots.forEach(function (d, k) { d.classList.toggle('active', k === index); });
    }

    // السهم "السابق" (يمين، ‹) يرجع للخلف، و"التالي" (شمال) يتقدّم
    if (prev) prev.addEventListener('click', function () { show(index - 1); });
    if (next) next.addEventListener('click', function () { show(index + 1); });
}

/* =======================================================
   4) الأسئلة الشائعة (FAQ)
   ======================================================= */
function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(function (q) {
        q.addEventListener('click', function () {
            q.closest('.faq-item').classList.toggle('open');
        });
    });
}

/* ---------------- تشغيل ---------------- */
document.addEventListener('DOMContentLoaded', function () {
    captureUTM();
    appendUTMToInternalLinks();
    initWizard();
    initCompareSliders();
    initCarousel();
    initFAQ();
});
