// ==========================================
// 0. STATO E CONFIGURAZIONI GLOBALI
// ==========================================
let bookHistoryEvents = [];
let isTransitioning = false;
let currentCoverIndex = null; 

const ticks = [5, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 71, 77, 83, 89, 95];

const mainTimelineBar = document.getElementById('timeline-bar');
const articleArea = document.getElementById('article-area');
const headerLogo = document.querySelector('.header-logo');
const mainContent = document.querySelector('.main-content');
const homeView = document.getElementById('home-view');
const backButton = document.getElementById('back-button');
const subheader = document.getElementById('subheader');

const spiegatoBeneImages = {
  "Come siamo arrivati fin qui tra Stati Uniti, Iran e Israele": "https://static-prod.cdnilpost.com/wp-content/uploads/2026/02/28/1772281921-jet-usa.jpg",
  "Cosa sappiamo dell’attacco di Israele e degli Stati Uniti contro l’Iran": "https://static-prod.cdnilpost.com/wp-content/uploads/2026/02/28/1772282212-teheran.jpg",
  "Perché l’Iran attacca obiettivi civili nei paesi del Golfo": "https://www.ilpost.it/wp-content/uploads/2026/03/01/1772381570-AP26060512560711.jpg",
  "Le cose da sapere sull’Iran per capire questa guerra": "https://static-prod.cdnilpost.com/wp-content/uploads/2026/03/02/1772454167-ira1.jpg",
  "I due approcchi alla guerra di Trump": "https://www.ilpost.it/wp-content/uploads/2026/03/02/1772487616-GettyImages-2263361689.jpg",
  "Chi è Mojtaba Khamenei": "https://static-prod.cdnilpost.com/wp-content/uploads/2026/03/04/1772607520-ilpost_2026030407570732_910f4a23c7b48d4a6933b321149d5733.jpg",
  "Cosa sono i drones Shahed, inventati dall’Iran": "https://static-prod.cdnilpost.com/wp-content/uploads/2026/03/03/1772570115-ilpost_20260303213438377_a869a4011f3f0e5803b2a0ef1e52570f.jpg"
};

async function loadArticles() {
  try {
    const response = await fetch('articoli.json'); 
    
    // Controllo di sicurezza: se il file non esiste (404) o ci sono problemi di rete
    if (!response.ok) {
      throw new Error(`Impossibile recuperare il file JSON. Stato HTTP: ${response.status}`);
    }
    
    bookHistoryEvents = await response.json();
    renderLayout();
  } catch (error) {
    // Questo ti dirà esattamente nei log della console se il problema è il percorso o la sintassi del JSON
    console.error("Errore nel caricamento degli articoli:", error);
  }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadArticles);
} else {
    loadArticles();
}

// ==========================================
// 1. RENDER LAYOUT TIMELINE PRINCIPALE
// ==========================================
function renderLayout() {
    console.log("3. [RENDER] Funzione renderLayout avviata.");
    
    // Verifichiamo se i contenitori HTML esistono davvero
    if (!mainTimelineBar || !articleArea) {
        console.error("ERRORE SILENZIOSO: Uno dei due contenitori HTML è NULL o UNDEFINED!", {
            mainTimelineBar: mainTimelineBar,
            articleArea: articleArea
        });
        return; // Si blocca qui se non trova gli elementi nell'HTML
    }
    
    if (!bookHistoryEvents || bookHistoryEvents.length === 0) {
        console.warn("ATTENZIONE: L'array bookHistoryEvents è vuoto o non definito.");
        return;
    }

    mainTimelineBar.innerHTML = '';
    articleArea.innerHTML = '';

    console.log(`4. [RENDER] Inizio ciclo su ${bookHistoryEvents.length} eventi.`);

    bookHistoryEvents.forEach((evt, index) => {
      try {
        // Controllo di sicurezza su spiegatoBeneImages per evitare crash devastanti
        if (typeof spiegatoBeneImages === 'undefined') {
            throw new Error("L'oggetto 'spiegatoBeneImages' non è definito nel tuo file JS.");
        }

        const line = document.createElement('div');
        line.className = 'timeline-line';
        line.setAttribute('data-target', evt.id);
        
        const tagsArray = evt.tags || [];
        line.setAttribute('data-tags', tagsArray.join(' '));
        line.innerHTML = `<div class="label"><span class="label-title">${evt.title}</span></div>`;
        
        if (tagsArray.includes('positive')) {
          line.classList.add('always-long');
        }
        
        mainTimelineBar.appendChild(line);

        const imageUrl = spiegatoBeneImages[evt.title] || '';
        const imageHTML = imageUrl 
          ? `<div class="article-image-box"><img src="${imageUrl}" alt="${evt.title}"></div>` 
          : `<div class="article-image-box empty"></div>`;

        const card = document.createElement('article');
        card.className = 'article-card';
        card.id = evt.id;
        card.setAttribute('data-tags', tagsArray.join(' '));
        
        const contentText = evt.content || '';
        const formattedContent = contentText.split('\n\n').map(paragrafo => `<p>${paragrafo}</p>`).join('');

        card.innerHTML = `
          <div class="article-card-body flex-layout">
            ${imageHTML}
            <div class="article-text-wrapper">
              <div class="article-card-header">
                <h2 class="featured-headline" style="font-size: 1.25rem; line-height: 1.4;">
                  <span class="article-date-inline">${evt.date}</span> 
                  <span class="article-title-text">${evt.title}</span>
                </h2>
                <span class="article-toggle">▼</span>
              </div>
              <div class="article-summary-block">${evt.summary}</div>
              <div class="article-card-content">
                ${formattedContent}
              </div>
            </div>
          </div>
        `;

        articleArea.appendChild(card);

        console.log(`-> Card [${index + 1}/${bookHistoryEvents.length}] generata per: "${evt.title}"`);
      } catch (loopError) {
         console.error(`Errore durante il rendering del singolo elemento all'indice ${index}:`, loopError);
      }


   });

  console.log("5. [RENDER] Ciclo completato. Inizializzazione interazioni...");
  
  if (typeof setupTimelineInteractions === 'function') {
      setupTimelineInteractions(); // L'unica chiamata pulita
      console.log("6. [SUCCESS] Interazioni della timeline attivate!");
  } else {
      console.error("ERRORE: setupTimelineInteractions non è una funzione definita nel codice.");
  }
}


function setupTimelineInteractions() {
  const lines = Array.from(document.querySelectorAll('.timeline-line'));
  const articles = Array.from(document.querySelectorAll('.article-card'));
  let collapseTimeoutId = null;

  lines.forEach((line, index) => {
    line.addEventListener('mouseenter', () => {
      if (collapseTimeoutId) { clearTimeout(collapseTimeoutId); collapseTimeoutId = null; }
      lines.forEach(l => l.classList.remove('hovered', 'hovered-above', 'hovered-below', 'hovered-near'));
      
      if (line.classList.contains('always-long')) {
        line.classList.add('hovered');
        return;
      }
      
      line.classList.add('hovered');
      if (index > 0 && !lines[index - 1].classList.contains('always-long')) lines[index - 1].classList.add('hovered-above');
      if (index < lines.length - 1 && !lines[index + 1].classList.contains('always-long')) lines[index + 1].classList.add('hovered-below');
      if (index > 1 && !lines[index - 2].classList.contains('always-long')) lines[index - 2].classList.add('hovered-near');
      if (index < lines.length - 2 && !lines[index + 2].classList.contains('always-long')) lines[index + 2].classList.add('hovered-near');
    });

    line.addEventListener('mouseleave', () => {
      collapseTimeoutId = setTimeout(() => {
        lines.forEach(l => l.classList.remove('hovered', 'hovered-above', 'hovered-below', 'hovered-near'));
      }, 800);
    });

    line.addEventListener('click', () => {
      lines.forEach(l => l.classList.remove('active'));
      line.classList.add('active');

      const targetId = line.getAttribute('data-target');
      const targetArticle = document.getElementById(targetId);
      
      if (targetArticle) {
        articles.forEach(art => art.classList.remove('expanded'));
        targetArticle.scrollIntoView({ behavior: 'smooth', block: 'start' });
        targetArticle.classList.add('expanded');
      }
    });
  });

  articles.forEach((card) => {
    const header = card.querySelector('.article-card-header');
    if (header) {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Controlla se la card si sta aprendo o chiudendo
        const isOpening = !card.classList.contains('expanded');
        card.classList.toggle('expanded');
        
        // Se si sta aprendo, aspetta un attimo che parta l'animazione e la centra in alto
        if (isOpening) {
          setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 250); // I millisecondi di attesa per rendere lo scroll fluidissimo
        }
      });
    }
  });
}

// ==========================================
// 2. FILTRI
// ==========================================
const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const filterVal = btn.getAttribute('data-filter');
    const lines = Array.from(document.querySelectorAll('.timeline-line'));
    const articles = Array.from(document.querySelectorAll('.article-card'));
    let firstVisibleArticle = null;
    
    articles.forEach((art, index) => {
      const rawTags = art.getAttribute('data-tags');
      const artTags = rawTags ? rawTags.split(' ') : [];
      const correspondingLine = lines[index];
      
      if (filterVal === 'all' || artTags.includes(filterVal)) {
        art.classList.remove('filtered-out');
        if (correspondingLine) correspondingLine.classList.remove('filtered-out');
        if (!firstVisibleArticle) firstVisibleArticle = art;
      } else {
        art.classList.add('filtered-out');
        art.classList.remove('expanded'); 
        if (correspondingLine) correspondingLine.classList.add('filtered-out');
      }
    });
    if (firstVisibleArticle) firstVisibleArticle.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ==========================================
// 3. NAVIGAZIONE INTERNA E PULSANTI HEADER
// ==========================================

  // Mostra Copertina -> timeline


// ==========================================
// 4. ANIMAZIONE DI RIPPLE DELLA COPERTINA INIZIALE
// ==========================================
function triggerCoverAnimation(e) {
  if (isTransitioning) return;

  const ripple = document.getElementById('transition-ripple');
  const cover = document.getElementById('initial-cover');
  if (!ripple || !cover) return;
  
  isTransitioning = true; 
  ripple.classList.remove('active');
  const radius = Math.max(window.innerWidth, window.innerHeight) * 1.5;
  
  ripple.style.position = 'fixed';
  ripple.style.width = `${radius * 2}px`;
  ripple.style.height = `${radius * 2}px`;
  ripple.style.left = `${e.clientX - radius}px`;
  ripple.style.top = `${e.clientY - radius}px`;
  ripple.offsetHeight;
  ripple.classList.add('active');
  
  setTimeout(() => { cover.classList.add('fade-out'); }, 700); 
  setTimeout(() => {
    cover.style.display = 'none';
    document.body.classList.remove('cover-active');
    isTransitioning = false; 
  }, 950);
}

// ==========================================
// 5. STRUTTURA ED EFFETTO FLIGHT DELLE TACCHE
// ==========================================
function scrollToMain() {
  if (isTransitioning) return; 

  const mainWrapper = document.getElementById('main-wrapper');
  const coverSection = document.querySelector('.cover-section');
  const tBar = document.getElementById('timeline-bar');
  const coverBar = document.querySelector('.cover-timeline-bar');
  
  if (mainWrapper) {
    isTransitioning = true;
    document.body.classList.remove('lock-scroll');
    
      if (currentCoverIndex !== null && bookHistoryEvents[currentCoverIndex]) {
        const targetId = bookHistoryEvents[currentCoverIndex].id;
        const targetArticle = document.getElementById(targetId);
        if (targetArticle) {
          targetArticle.scrollIntoView({ behavior: 'smooth', block: 'start' });
          targetArticle.classList.add('expanded');
        }
      }

    if (coverBar && tBar) {
      const coverRect = coverBar.getBoundingClientRect();
      const originalDisplay = tBar.style.display;
      const originalVisibility = tBar.style.visibility;
      
      tBar.style.setProperty('display', 'flex', 'important');
      tBar.style.setProperty('visibility', 'hidden', 'important');

      const mainLines = tBar.querySelectorAll('.timeline-line');
      const targets = [];
      
      mainLines.forEach((line) => {
         const lineRect = line.getBoundingClientRect();
         const computedStyle = window.getComputedStyle(line);
         const finalHeight = parseFloat(computedStyle.height) || 2; 

         targets.push({
           left: lineRect.left,
           top: lineRect.top + (lineRect.height / 2) - (finalHeight / 2),
           width: parseFloat(computedStyle.width) || 30,
           height: finalHeight
         });
      });

      tBar.style.display = originalDisplay;
      tBar.style.visibility = originalVisibility;
      coverBar.style.opacity = '0.2';
      coverBar.style.transition = 'opacity 0.2s ease';

      ticks.forEach((pct, index) => {
        const startLeft = coverRect.left + (coverRect.width * pct / 100);
        const startTop = coverRect.top;
        const startWidth = 2; 
        const startHeight = coverRect.height || 18; 

        let endLeft = startLeft;
        let endTop = targets[index] ? targets[index].top : startTop + window.innerHeight;
        let endWidth = 30; 
        let endHeight = 2;

        if (targets[index]) {
          endLeft = targets[index].left;
          endTop = targets[index].top;
          endWidth = targets[index].width;   
          endHeight = targets[index].height; 
        }

        const flyingTick = document.createElement('div');
        flyingTick.className = 'flying-tick';
        
        flyingTick.style.position = 'fixed';
        flyingTick.style.left = `${startLeft}px`;
        flyingTick.style.top = `${endTop}px`;
        flyingTick.style.width = `${startWidth}px`;
        flyingTick.style.height = `${startHeight}px`;
        flyingTick.style.backgroundColor = '#000000'; 
        flyingTick.style.zIndex = '100000';
        flyingTick.style.pointerEvents = 'none';
        flyingTick.style.borderRadius = '1px';

        flyingTick.style.transition = `
          left 0.8s cubic-bezier(0.25, 1, 0.5, 1), 
          top 0.8s cubic-bezier(0.25, 1, 0.5, 1), 
          width 0.8s cubic-bezier(0.25, 1, 0.5, 1), 
          height 0.4s cubic-bezier(0.25, 1, 0.5, 1), 
          background-color 0.2s ease
        `;

        document.body.appendChild(flyingTick);
        flyingTick.offsetHeight;

        flyingTick.style.left = `${endLeft}px`;
        flyingTick.style.top = `${endTop}px`;
        flyingTick.style.width = `${endWidth}px`;   
        flyingTick.style.height = `${endHeight}px`; 
        flyingTick.style.backgroundColor = '#ffffff'; 

        setTimeout(() => { flyingTick.remove(); }, 800);
      });
    }
    
    mainWrapper.scrollIntoView({ behavior: 'smooth' });
    
    setTimeout(() => {
      if (coverSection) {
        coverSection.classList.add('hidden'); 
        window.scrollTo(0, 0); 
        
        if (tBar) tBar.classList.add('visible');

        // Scorre all'articolo selezionato (ma senza aprirlo in automatico)
        if (currentCoverIndex !== null && bookHistoryEvents[currentCoverIndex]) {
          const targetId = bookHistoryEvents[currentCoverIndex].id;
          const targetArticle = document.getElementById(targetId);
          if (targetArticle) {
            targetArticle.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
        isTransitioning = false;
      }
    }, 800); 
  }
}

// ==========================================
// 6. DRAG & CLICK SULLA TIMELINE DELLA COPERTINA
// ==========================================
const coverTimelineBar = document.querySelector('.cover-timeline-bar');
const coverIndicator = document.querySelector('.cover-timeline-indicator');
const coverScrollButton = document.querySelector('.cover-scroll-button');

function updateButtonText(index) {
  if (!coverScrollButton) return;
  if (index === null) {
    coverScrollButton.textContent = "scorri giù ↓";
  } else if (bookHistoryEvents && bookHistoryEvents[index]) {
    coverScrollButton.textContent = bookHistoryEvents[index].title;
  }
}

function setIndicatorPosition(percentage, useTransition = true) {
  if (!coverIndicator) return;
  coverIndicator.style.transition = useTransition ? 'left 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none';
  coverIndicator.style.left = `${percentage}%`;
}

function getClosestTickIndex(currentPercentage) {
  return ticks.reduce((closestIdx, tickValue, idx) => {
    return Math.abs(tickValue - currentPercentage) < Math.abs(ticks[closestIdx] - currentPercentage) ? idx : closestIdx;
  }, 0);
}

function moveTimeline(direction) {
  if (currentCoverIndex === null) {
    currentCoverIndex = direction > 0 ? 8 : 7;
  } else {
    currentCoverIndex = Math.max(0, Math.min(ticks.length - 1, currentCoverIndex + direction));
  }
  setIndicatorPosition(ticks[currentCoverIndex]);
  updateButtonText(currentCoverIndex);
}

let isDragging = false;

function handleMove(e) {
  if (!isDragging || !coverTimelineBar) return;
  const rect = coverTimelineBar.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  let percentage = ((clientX - rect.left) / rect.width) * 100;
  percentage = Math.max(5, Math.min(95, percentage));
  setIndicatorPosition(percentage, false);
  const temporaryIndex = getClosestTickIndex(percentage);
  updateButtonText(temporaryIndex);
}

function stopDragging() {
  if (!isDragging || !coverIndicator) return;
  isDragging = false;
  let currentLeft = parseFloat(coverIndicator.style.left);
  if (isNaN(currentLeft)) currentLeft = 50; 
  currentCoverIndex = getClosestTickIndex(currentLeft);
  setIndicatorPosition(ticks[currentCoverIndex], true);
  updateButtonText(currentCoverIndex);
  window.removeEventListener('mousemove', handleMove);
  window.removeEventListener('mouseup', stopDragging);
  window.removeEventListener('touchmove', handleMove);
  window.removeEventListener('touchend', stopDragging);
}

function startDragging(e) {
  isDragging = true;
  e.preventDefault(); 
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', stopDragging);
  window.addEventListener('touchmove', handleMove, { passive: false });
  window.addEventListener('touchend', stopDragging);
}

if (coverIndicator && coverTimelineBar) {
  coverIndicator.addEventListener('mousedown', startDragging);
  coverIndicator.addEventListener('touchstart', startDragging, { passive: false });
  coverTimelineBar.addEventListener('mousedown', (e) => {
    if (e.target === coverIndicator) return;
    isDragging = true;
    handleMove(e);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', stopDragging);
  });
}

// ==========================================
// 7. INTERAZIONE DELLA MAPPA INFOGRAFICA
// ==========================================
const mapData = [
  { src: "BasiRisorse.png", caption: "Basi e risorse di appoggio degli Stati Uniti attaccate dall'Iran" },
  { src: "InfrastruttureEn.png", caption: "Le infrastrutture energetiche colpite" },
  { src: "Porti.png", caption: "Porti e aeroporti civili colpiti" },
  { src: "Sedi.png", caption: "Le sedi diplomatiche statunitensi colpite" }
];
let currentMapIndex = 0;
const mapImgEl = document.getElementById('map-img');
const mapCaptionEl = document.getElementById('map-caption');
const mapPrevBtn = document.getElementById('map-prev');
const mapNextBtn = document.getElementById('map-next');

function updateMapDisplay() {
  if (mapImgEl && mapCaptionEl && mapData[currentMapIndex]) {
    mapImgEl.src = mapData[currentMapIndex].src;
    mapCaptionEl.textContent = mapData[currentMapIndex].caption;
  }
}

if (mapPrevBtn && mapNextBtn) {
  mapPrevBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentMapIndex = (currentMapIndex - 1 + mapData.length) % mapData.length;
    updateMapDisplay();
  });
  mapNextBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentMapIndex = (currentMapIndex + 1) % mapData.length;
    updateMapDisplay();
  });
}

// ==========================================
// 8. MASTERPOST & ALTRI THREADS OVERLAY + INTRO
// ==========================================


// ==========================================
// UNIFICAZIONE EVENTI DOM (Incollalo alla fine del file)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // --- 1. Navigazione Header (Sezione 3) ---
  const logoBtn = document.querySelector('.header-logo');
  const viewHome = document.getElementById('home-view');
  const viewMain = document.querySelector('.main-content');
  const subHeader = document.getElementById('subheader');
  const btnBackTimeline = document.getElementById('back-button'); 
  const btnBackCover = document.getElementById('back-to-cover-btn'); 

  if (logoBtn && viewMain && viewHome) {
    logoBtn.addEventListener('click', () => {
      window.scrollTo(0, 0);
      viewMain.style.display = 'none';
      viewHome.style.display = 'block';
      if (subHeader) subHeader.classList.add('hidden');
    });
  }

  if (btnBackTimeline && viewHome && viewMain) {
    btnBackTimeline.addEventListener('click', () => {
      window.scrollTo(0, 0);
      viewHome.style.display = 'none';
      viewMain.style.display = 'flex';
      if (subHeader) subHeader.classList.remove('hidden');
    });
  }

  if (btnBackCover) {
    btnBackCover.addEventListener('click', () => {
      const coverSection = document.getElementById('cover-section') || document.querySelector('.cover-section');
      const tBar = document.getElementById('timeline-bar');
      const coverBar = document.querySelector('.cover-timeline-bar');

      if (coverSection) {
        // Aggiunto "let" qui, a meno che non sia una variabile globale già definita altrove
        let currentCoverIndex = 7; 
        
        if (typeof setIndicatorPosition === 'function') setIndicatorPosition(50, false);
        if (typeof updateButtonText === 'function') updateButtonText(currentCoverIndex);

        coverSection.classList.remove('hidden');
        document.body.classList.add('lock-scroll');
        if (coverBar) coverBar.style.opacity = '1';
        
        if (tBar) {
          tBar.style.display = 'none';
          tBar.classList.remove('visible');
          setTimeout(() => { tBar.style.display = ''; }, 50);
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    });
  }

  // --- 2. Masterpost & Overlay (Sezione 8) ---
  const masterpostTitle = document.getElementById('masterpost-title');
  const otherThreadsOverlay = document.getElementById('other-threads-overlay');
  const closeThreadsBtn = document.getElementById('close-threads-btn');

  function updateAnimationOrigin() {
    if (!masterpostTitle || !otherThreadsOverlay) return;
    const wasHidden = otherThreadsOverlay.classList.contains('hidden');
    if (wasHidden) otherThreadsOverlay.classList.remove('hidden');

    const titleRect = masterpostTitle.getBoundingClientRect();
    const overlayRect = otherThreadsOverlay.getBoundingClientRect();
    const originX = (titleRect.left + titleRect.width / 2) - overlayRect.left;
    const originY = (titleRect.top + titleRect.height / 2) - overlayRect.top;

    otherThreadsOverlay.style.transformOrigin = `${originX}px ${originY}px`;
    if (wasHidden) otherThreadsOverlay.classList.add('hidden');
  }

  if (masterpostTitle && otherThreadsOverlay) {
    masterpostTitle.addEventListener('click', (e) => {
      e.stopPropagation();
      updateAnimationOrigin();
      otherThreadsOverlay.classList.remove('hidden');
      otherThreadsOverlay.style.animation = 'expandFromTitle 0.5s cubic-bezier(0.165, 0.84, 0.44, 1) forwards';
    });
  }

  if (closeThreadsBtn && otherThreadsOverlay) {
    closeThreadsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      updateAnimationOrigin();
      otherThreadsOverlay.style.animation = 'shrinkToTitle 0.4s cubic-bezier(0.895, 0.03, 0.685, 0.22) forwards';
      setTimeout(() => {
        otherThreadsOverlay.classList.add('hidden');
      }, 400);
    });
  }
  
  window.addEventListener('resize', () => {
    if (otherThreadsOverlay && !otherThreadsOverlay.classList.contains('hidden')) {
      updateAnimationOrigin();
    }
  });

  // --- 3. Schermata Introduzione ---
  const introScreen = document.getElementById('introduzione');
  if (introScreen) {
    introScreen.addEventListener('click', () => {
      introScreen.classList.add('fade-out');
    });
  }
});
