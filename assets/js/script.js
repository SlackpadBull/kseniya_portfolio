const viewer = document.getElementById('viewer')
const viewerBody = document.getElementById('viewerBody')
const cards = Array.from(document.querySelectorAll('.card'))

let currentIndex = 0
let scrollY = 0
let isViewerOpen = false

// =========================
// SCROLL LOCK
// =========================
function lockScroll() {
    scrollY = window.scrollY

    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
}

function unlockScroll() {
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''

    window.scrollTo(0, scrollY)
}

// =========================
// RENDER PROJECT (CACHE SAFE)
// =========================
function renderProject(slug) {
    const template = document.getElementById('project-' + slug)
    if (!template) return

    viewerBody.innerHTML = ''
    viewerBody.appendChild(template.content.cloneNode(true))
}

// =========================
// OPEN PROJECT
// =========================
function openProject(slug, push = true) {
    ym(109520628, 'reachGoal', `project_${slug}`)

    currentIndex = cards.findIndex(c => c.dataset.project === slug)

    renderProject(slug)

    viewer.classList.add('active')

    if (!isViewerOpen) {
        lockScroll()
        isViewerOpen = true
    }

    if (push) {
        history.pushState({ slug }, '', '#project/' + slug)
    }
}

// =========================
// SWITCH PROJECT
// =========================
function switchProject(slug) {
    ym(109520628, 'reachGoal', `project_${slug}`)

    renderProject(slug)

    history.pushState({ slug }, '', '#project/' + slug)
}

// =========================
// NAVIGATION
// =========================
function next() {
    currentIndex = (currentIndex + 1) % cards.length
    switchProject(cards[currentIndex].dataset.project)
}

function prev() {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length
    switchProject(cards[currentIndex].dataset.project)
}

// =========================
// CLOSE VIEWER
// =========================
function closeViewer() {
    viewer.classList.remove('active')
    viewerBody.innerHTML = ''

    if (isViewerOpen) {
        unlockScroll()
        isViewerOpen = false
    }

    history.pushState({}, '', location.pathname + location.search)
    currentIndex = 0
}

// =========================
// EVENTS
// =========================
cards.forEach(card => {
    card.addEventListener('click', () => {
        openProject(card.dataset.project)
    })
})

document.querySelector('.viewer-next')?.addEventListener('click', next)
document.querySelector('.viewer-prev')?.addEventListener('click', prev)
document.querySelector('.viewer-close')?.addEventListener('click', closeViewer)

viewer.addEventListener('click', e => {
    if (e.target.classList.contains('viewer-close-area')) {
        closeViewer()
    }
})

// =========================
// KEYBOARD NAVIGATION
// =========================
document.addEventListener('keydown', e => {
    if (!viewer.classList.contains('active')) return
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return

    if (e.key === 'Escape') closeViewer()
    if (e.key === 'ArrowRight') next()
    if (e.key === 'ArrowLeft') prev()
})

// =========================
// BROWSER BACK (IMPORTANT FIX)
// =========================
window.addEventListener('popstate', () => {
    const hash = location.hash.slice(1)

    if (hash.startsWith('project/')) {
        const slug = hash.split('/')[1]
        openProject(slug, false)
    } else {
        if (isViewerOpen) {
            closeViewer()
        }
    }
})

// =========================
// TOUCH FIX
// =========================
viewer.addEventListener(
    'touchmove',
    e => {
        if (!viewer.classList.contains('active')) return
        if (!e.target.closest('.viewer-content')) {
            e.preventDefault()
        }
    },
    { passive: false }
)

// =========================
// INITIAL LOAD ROUTING
// =========================
window.addEventListener('load', () => {
    const hash = location.hash.slice(1)

    if (hash.startsWith('project/')) {
        const slug = hash.split('/')[1]
        openProject(slug, false)
    }
})

/* =========================
GRID GLOW DOTS (без изменений)
========================= */
;(function () {
    const hero = document.querySelector('.hero')
    const gridBg = document.querySelector('.grid-bg')
    if (!hero || !gridBg) return

    const MAX_GLOW_INTENSITY = 0.75

    const canvas = document.createElement('canvas')
    canvas.className = 'grid-glow-canvas'
    gridBg.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    const gridSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-size')) || 64
    const glowRadius = 160
    let mouse = null
    let frameScheduled = false
    let cachedRect

    function resizeCanvas() {
        cachedRect = gridBg.getBoundingClientRect()
        const ratio = window.devicePixelRatio || 1

        canvas.width = cachedRect.width * ratio
        canvas.height = cachedRect.height * ratio

        canvas.style.width = `${cachedRect.width}px`
        canvas.style.height = `${cachedRect.height}px`

        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }

    function drawGlow() {
        frameScheduled = false
        clearCanvas()
        if (!mouse) return

        const rect = cachedRect
        const x = mouse.x - rect.left
        const y = mouse.y - rect.top

        const startCol = Math.floor((x - glowRadius) / gridSize)
        const endCol = Math.ceil((x + glowRadius) / gridSize)
        const startRow = Math.floor((y - glowRadius) / gridSize)
        const endRow = Math.ceil((y + glowRadius) / gridSize)

        ctx.globalCompositeOperation = 'lighter'

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const px = col * gridSize
                const py = row * gridSize

                const dx = px - x
                const dy = py - y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist > glowRadius) continue

                const intensity = Math.max(0, MAX_GLOW_INTENSITY - dist / glowRadius)
                const glowStrength = Math.pow(intensity, 0.95)

                const outerRadius = 6 + glowStrength * 18
                const outerAlpha = 0.02 + glowStrength * 0.22

                const g = ctx.createRadialGradient(px, py, 0, px, py, outerRadius)
                g.addColorStop(0, `rgba(149,255,190,${outerAlpha})`)
                g.addColorStop(1, 'rgba(149,255,190,0)')

                ctx.fillStyle = g
                ctx.beginPath()
                ctx.arc(px, py, outerRadius, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        ctx.globalCompositeOperation = 'source-over'
    }

    function scheduleDraw() {
        if (!frameScheduled) {
            frameScheduled = true
            requestAnimationFrame(drawGlow)
        }
    }

    hero.addEventListener('mousemove', e => {
        mouse = { x: e.clientX, y: e.clientY }
        scheduleDraw()
    })

    hero.addEventListener('mouseleave', () => {
        mouse = null
        clearCanvas()
    })

    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()
})()