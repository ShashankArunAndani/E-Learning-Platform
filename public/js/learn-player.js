/**
 * DFD-2.7 (7.12–7.14): Lesson completion with real-time progress bar update
 */
(function () {
  const completeBtn = document.getElementById('complete-lesson-btn');
  if (!completeBtn) return;

  const sidebarBar = document.getElementById('sidebar-progress-bar');
  const sidebarPct = document.getElementById('sidebar-progress-pct');
  const sidebarCount = document.getElementById('sidebar-lesson-count');
  const mainBar = document.getElementById('main-progress-bar');
  const mainPct = document.getElementById('main-progress-pct');
  const completeBanner = document.getElementById('course-complete-banner');
  const nextLessonLink = document.getElementById('next-lesson-link');

  function updateProgressUI(progress, certificateUrl) {
    const pct = Math.min(100, parseFloat(progress.completion_percentage || 0));
    const width = pct + '%';

    if (sidebarBar) sidebarBar.style.width = width;
    if (mainBar) mainBar.style.width = width;
    if (sidebarPct) sidebarPct.textContent = pct.toFixed(0) + '%';
    if (mainPct) mainPct.textContent = pct.toFixed(0) + '%';
    if (sidebarCount) sidebarCount.textContent = progress.completed_lessons;

    if (progress.completion_status === 'completed' && completeBanner) {
      completeBanner.classList.add('visible');
      if (certificateUrl) {
        const link = completeBanner.querySelector('a');
        if (link) link.href = '/certificate/' + certificateUrl;
      }
    }
  }

  completeBtn.addEventListener('click', async function () {
    const url = completeBtn.dataset.url;
    completeBtn.disabled = true;
    completeBtn.textContent = 'Saving...';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to mark lesson complete');
      }

      updateProgressUI(data.progress, data.certificateUrl);

      const doneLabel = document.createElement('span');
      doneLabel.style.fontSize = '0.85rem';
      doneLabel.style.color = 'var(--verdant)';
      doneLabel.style.fontWeight = '600';
      doneLabel.textContent = '✓ Lesson Completed';
      completeBtn.replaceWith(doneLabel);

      // Mark current lesson as completed in sidebar
      const activeItem = document.querySelector('.lesson-nav-item.active');
      if (activeItem) {
        activeItem.classList.add('completed');
        const indexEl = activeItem.querySelector('.lesson-nav-index');
        if (indexEl) indexEl.textContent = '✓';
      }

      if (data.nextLessonUrl && nextLessonLink) {
        nextLessonLink.href = data.nextLessonUrl;
        nextLessonLink.classList.remove('btn-secondary');
        nextLessonLink.classList.add('btn-primary');
      }
    } catch (err) {
      completeBtn.disabled = false;
      completeBtn.textContent = 'Mark as Complete';
      alert(err.message || 'Something went wrong. Please try again.');
    }
  });
})();
