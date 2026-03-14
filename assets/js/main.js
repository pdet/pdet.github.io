jQuery(document).ready(function($) {

    /* Skill bar animation */
    $('.level-bar-inner').css('width', '0');

    $(window).on('load', function() {
        $('.level-bar-inner').each(function() {
            var itemWidth = $(this).data('level');
            $(this).animate({
                width: itemWidth
            }, 800);
        });
    });

    /* Dark mode toggle (theme detection is in head.html to prevent FOUC) */
    var darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        function updateIcon() {
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            var icon = darkModeToggle.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            }
        }

        updateIcon();

        darkModeToggle.addEventListener('click', function() {
            var currentTheme = document.documentElement.getAttribute('data-theme');
            var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon();
        });
    }

    /* Smooth scrolling for nav links */
    $('.site-nav a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        var target = $(this.getAttribute('href'));
        if (target.length) {
            $('html, body').animate({
                scrollTop: target.offset().top - 50
            }, 500);
        }
    });

});
