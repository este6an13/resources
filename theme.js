document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    
    // SVG paths
    const sunPath = "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z";
    const moonPath = "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z";

    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeIcon) themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="${moonPath}"></path>`;
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            
            if (isDark) {
                localStorage.setItem('theme', 'dark');
                if (themeIcon) themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="${moonPath}"></path>`;
            } else {
                localStorage.setItem('theme', 'light');
                if (themeIcon) themeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" d="${sunPath}"></path>`;
            }
        });
    }
});
