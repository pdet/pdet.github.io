document.addEventListener('DOMContentLoaded', function() {

    /* Dark mode toggle (theme detection is in head.html to prevent FOUC) */
    var darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        function updateToggle() {
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            darkModeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        }

        updateToggle();

        darkModeToggle.addEventListener('click', function() {
            var currentTheme = document.documentElement.getAttribute('data-theme');
            var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateToggle();
        });
    }

    /* Active nav link on scroll (only observe sections that have nav links) */
    var navLinks = document.querySelectorAll('.site-nav a[href^="#"]');
    var navIds = [];
    navLinks.forEach(function(link) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            navIds.push(href.substring(1));
        }
    });

    var sections = document.querySelectorAll('.section[id]');
    var navSections = [];
    sections.forEach(function(section) {
        if (navIds.indexOf(section.id) !== -1) {
            navSections.push(section);
        }
    });

    if (navSections.length && navLinks.length) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    navLinks.forEach(function(link) { link.classList.remove('active'); });
                    var activeLink = document.querySelector('.site-nav a[href="#' + entry.target.id + '"]');
                    if (activeLink) activeLink.classList.add('active');
                }
            });
        }, { rootMargin: '-20% 0px -60% 0px' });

        navSections.forEach(function(section) { observer.observe(section); });
    }

});
