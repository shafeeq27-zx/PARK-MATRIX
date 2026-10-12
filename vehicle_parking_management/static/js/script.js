/**
 * Vehicle Parking Management System - Client Script
 */

document.addEventListener('DOMContentLoaded', function () {
    // 1. Live Digital Clock in Header
    const clockEl = document.getElementById('liveClock');
    if (clockEl) {
        function updateClock() {
            const now = new Date();
            const timeString = now.toLocaleTimeString([], { hour12: false });
            const dateString = now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            clockEl.innerHTML = `<span class="time-text">${timeString}</span> <span class="date-text" style="color:#94a3b8;font-size:0.75rem;margin-left:6px;">${dateString}</span>`;
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    // 2. Mobile Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('open');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', function (e) {
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }

    // 3. Auto-dismiss alerts after 5 seconds
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(function (alert) {
        setTimeout(function () {
            alert.style.transition = 'opacity 0.5s ease';
            alert.style.opacity = '0';
            setTimeout(function () { alert.remove(); }, 500);
        }, 5000);
    });

    // 4. Force Uppercase on Registration Plate inputs
    const regInputs = document.querySelectorAll('.uppercase');
    regInputs.forEach(function (input) {
        input.addEventListener('input', function () {
            this.value = this.value.toUpperCase();
        });
    });

    // 5. Modal dialog escape key handler
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => modal.style.display = 'none');
        }
    });
});
