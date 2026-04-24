const viewer = document.getElementById('viewer');
const viewerBody = document.getElementById('viewerBody');
const cards = Array.from(document.querySelectorAll('.card'));

let currentIndex = 0;

/* =========================
CLICK ON CARD
========================= */
cards.forEach(card => {
    card.addEventListener('click', () => {
        openProject(card.dataset.project);
    });
});

/* =========================
OPEN PROJECT
========================= */
function openProject(slug, push = true) {
    const template = document.getElementById('project-' + slug);
    if (!template) {
        console.warn(`Template for "${slug}" not found`);
        return;
    }

    currentIndex = cards.findIndex(c => c.dataset.project === slug);
    
    viewerBody.innerHTML = '';
    viewerBody.appendChild(template.content.cloneNode(true));
    
    viewer.classList.add('active');
    document.body.classList.add('no-scroll');

    if (push) {
        // Используем hash вместо pushState для работы с file://
        location.hash = 'project/' + slug;
    }
}

/* =========================
CLOSE VIEWER
========================= */
function closeViewer() {
    viewer.classList.remove('active');
    viewerBody.innerHTML = '';
    document.body.classList.remove('no-scroll');
    
    // Очищаем hash при закрытии
    location.hash = '';
}

/* =========================
NAVIGATION
========================= */
function next() {
    currentIndex = (currentIndex + 1) % cards.length;
    openProject(cards[currentIndex].dataset.project);
}

function prev() {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length;
    openProject(cards[currentIndex].dataset.project);
}

document.querySelector('.viewer-next').onclick = next;
document.querySelector('.viewer-prev').onclick = prev;

/* =========================
CLOSE EVENTS
========================= */
document.querySelector('.viewer-close').onclick = closeViewer;

viewer.addEventListener('click', e => {
    if (e.target.classList.contains('viewer-close-area')) {
        closeViewer();
    }
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeViewer();
});


/* =========================
HASH HANDLING
========================= */
function handleHash() {
    const hash = location.hash.slice(1); // убираем #
    
    if (hash.startsWith('project/')) {
        const slug = hash.split('/')[1];
        if (slug) {
            openProject(slug, false);
        }
    }
}

window.addEventListener('hashchange', handleHash);
window.addEventListener('load', handleHash);

// Блокировка скролла фона при касаниях вне модального контента
viewer.addEventListener('touchmove', (e) => {
    if (!e.target.closest('.viewer-content')) {
        e.preventDefault();
    }
}, { passive: false });

