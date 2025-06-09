let currentLang = 'it';
if (window.location.pathname.includes('_en')) currentLang = 'en';
if (localStorage.getItem('lang')) currentLang = localStorage.getItem('lang');

document.addEventListener('DOMContentLoaded', function() {
    const langToggle = document.getElementById('lang-toggle');
    if (!langToggle) return;

    // Imposta lo stato iniziale dello switch
    langToggle.checked = (currentLang === 'en');

    langToggle.addEventListener('change', function() {
        if (langToggle.checked) {
            localStorage.setItem('lang', 'en');
            window.location.href = 'index_en.html';
        } else {
            localStorage.setItem('lang', 'it');
            window.location.href = 'index.html';
        }
    });
});