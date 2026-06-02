const viewer = document.getElementById('viewer')
const viewerBody = document.getElementById('viewerBody')
const cards = Array.from(document.querySelectorAll('.card'))

let currentIndex = 0
let scrollY = 0
let isViewerOpen = false

// =========================
// SCROLL LOCK (FIXED)
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

/* =========================
CLICK ON CARD
========================= */
cards.forEach(card => {
    card.addEventListener('click', () => {
        openProject(card.dataset.project)
    })
})

/* =========================
OPEN PROJECT
========================= */
function openProject(slug, push = true) {
    ym(109520628, 'reachGoal', `project_${slug}`)

    const template = document.getElementById('project-' + slug)
    if (!template) return

    currentIndex = cards.findIndex(c => c.dataset.project === slug)

    viewerBody.innerHTML = ''
    viewerBody.appendChild(template.content.cloneNode(true))

    viewer.classList.add('active')

    // 🔥 LOCK ТОЛЬКО ПРИ ПЕРВОМ ОТКРЫТИИ
    if (!isViewerOpen) {
        lockScroll()
        isViewerOpen = true
    }

    if (push) {
        history.pushState({ slug }, '', '#project/' + slug)
    }
}

/* =========================
SWITCH PROJECT (NEXT/PREV FIX)
========================= */
function switchProject(slug) {
    ym(109520628, 'reachGoal', `project_${slug}`)

    const template = document.getElementById('project-' + slug)
    if (!template) return

    viewerBody.innerHTML = ''
    viewerBody.appendChild(template.content.cloneNode(true))

    history.replaceState({ slug }, '', '#project/' + slug)
}

/* =========================
NAVIGATION
========================= */
function next() {
    currentIndex = (currentIndex + 1) % cards.length
    switchProject(cards[currentIndex].dataset.project)
}

function prev() {
    currentIndex = (currentIndex - 1 + cards.length) % cards.length
    switchProject(cards[currentIndex].dataset.project)
}

document.querySelector('.viewer-next').onclick = next
document.querySelector('.viewer-prev').onclick = prev

/* =========================
CLOSE VIEWER
========================= */
function closeViewer() {
    viewer.classList.remove('active')
    viewerBody.innerHTML = ''

    if (isViewerOpen) {
        unlockScroll()
        isViewerOpen = false
    }

    history.replaceState(null, '', location.pathname + location.search)
}

/* =========================
CLOSE EVENTS
========================= */
document.querySelector('.viewer-close').onclick = closeViewer

viewer.addEventListener('click', e => {
    if (e.target.classList.contains('viewer-close-area')) {
        closeViewer()
    }
})

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeViewer()
})

/* =========================
HASH HANDLING
========================= */
function handleHash() {
    const hash = location.hash.slice(1)

    if (hash.startsWith('project/')) {
        const slug = hash.split('/')[1]
        if (slug) openProject(slug, false)
    }
}

window.addEventListener('popstate', handleHash)
window.addEventListener('load', handleHash)

/* =========================
TOUCH FIX
========================= */
viewer.addEventListener(
    'touchmove',
    e => {
        if (!e.target.closest('.viewer-content')) {
            e.preventDefault()
        }
    },
    { passive: false }
)

/* =========================
GRID GLOW DOTS
========================= */
;(function () {
    const hero = document.querySelector('.hero')
    const gridBg = document.querySelector('.grid-bg')
    if (!hero || !gridBg) return

    // Configurable maximum intensity for grid glow
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
        const rect = cachedRect
        const ratio = window.devicePixelRatio || 1
        canvas.width = rect.width * ratio
        canvas.height = rect.height * ratio
        canvas.style.width = `${rect.width}px`
        canvas.style.height = `${rect.height}px`
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    function clearCanvas() {
        ctx.clearRect(
            0,
            0,
            canvas.width / (window.devicePixelRatio || 1),
            canvas.height / (window.devicePixelRatio || 1),
        )
    }

    function drawGlow() {
        frameScheduled = false
        clearCanvas()
        if (!mouse) return

        const rect = cachedRect
        const x = mouse.x - rect.left
        const y = mouse.y - rect.top
        const startCol = Math.max(0, Math.floor((x - glowRadius) / gridSize))
        const endCol = Math.min(Math.ceil((x + glowRadius) / gridSize), Math.ceil(rect.width / gridSize))
        const startRow = Math.max(0, Math.floor((y - glowRadius) / gridSize))
        const endRow = Math.min(Math.ceil((y + glowRadius) / gridSize), Math.ceil(rect.height / gridSize))

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

                // Большое мягкое размытие (фон)
                const outerRadius = 6 + glowStrength * 18
                const outerAlpha = 0.02 + glowStrength * 0.22
                const g = ctx.createRadialGradient(px, py, 0, px, py, outerRadius)
                g.addColorStop(0, `rgba(149,255,190,${Math.min(0.9, outerAlpha * 2)})`)
                g.addColorStop(0.2, `rgba(149,255,190,${outerAlpha})`)
                g.addColorStop(1, `rgba(149,255,190,0)`)

                ctx.save()
                ctx.fillStyle = g
                // Используем фильтр для дополнительного смягчения
                ctx.filter = `blur(${8 * (1 - Math.pow(1 - glowStrength, 0.5))}px)`
                ctx.beginPath()
                ctx.arc(px, py, outerRadius, 0, Math.PI * 2)
                ctx.fill()
                ctx.restore()

                // Ядро — маленькая яркая точка со свечением
                const coreRadius = 0.5 + glowStrength * 1
                const coreAlpha = 0.35 * glowStrength
                ctx.save()
                ctx.filter = 'none'
                ctx.shadowColor = `rgba(255, 255, 220, ${coreAlpha})`
                ctx.shadowBlur = 12 * glowStrength
                ctx.fillStyle = `rgba(255, 255, 220, ${coreAlpha})`
                ctx.beginPath()
                ctx.arc(px, py, coreRadius, 0, Math.PI * 2)
                ctx.fill()
                ctx.restore()
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

    function handleMove(event) {
        mouse = { x: event.clientX, y: event.clientY }
        scheduleDraw()
    }

    function handleLeave() {
        mouse = null
        clearCanvas()
    }

    window.addEventListener('resize', resizeCanvas)
    hero.addEventListener('mousemove', handleMove)
    hero.addEventListener('mouseleave', handleLeave)
    hero.addEventListener('pointerleave', handleLeave)
    resizeCanvas()
})()
