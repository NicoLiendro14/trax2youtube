// Traxsource DOM parser - extracts track info from chart pages

function parseDuration(str) {
  if (!str) return 0;
  
  str = str.trim().replace(/[()]/g, '');
  const parts = str.split(':').map(p => parseInt(p, 10) || 0);
  
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  
  return 0;
}

function formatDuration(seconds) {
  if (seconds <= 0) return '0:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function parseTracks() {
  const tracks = [];
  const trackRows = document.querySelectorAll('#trkListCont .trk-row');
  
  trackRows.forEach((row, index) => {
    const trackId = row.getAttribute('data-trid') || '';
    
    const tnumElem = row.querySelector('.tnum');
    const position = tnumElem?.textContent?.trim() || String(index + 1);
    
    const titleElem = row.querySelector('.trk-cell.title a');
    const title = titleElem?.textContent?.trim() || '';
    
    const versionElem = row.querySelector('.trk-cell.title .version');
    let version = '';
    let durationSeconds = 0;
    
    if (versionElem) {
      const durationElem = versionElem.querySelector('.duration');
      if (durationElem) {
        const durationText = durationElem.textContent?.trim() || '';
        durationSeconds = parseDuration(durationText);
        version = versionElem.textContent?.trim().replace(durationText, '').trim() || '';
      } else {
        version = versionElem.textContent?.trim() || '';
      }
    }
    
    const artistElems = row.querySelectorAll('.trk-cell.artists a.com-artists');
    const artists = Array.from(artistElems)
      .map(a => a.textContent?.trim())
      .filter(Boolean);
    const artistsStr = artists.join(', ');
    
    const labelElem = row.querySelector('.trk-cell.label a');
    const label = labelElem?.textContent?.trim() || '';
    
    const genreElem = row.querySelector('.trk-cell.genre a');
    const genre = genreElem?.textContent?.trim() || '';
    
    tracks.push({
      id: trackId,
      position,
      title,
      version,
      durationSeconds,
      durationFormatted: formatDuration(durationSeconds),
      artists: artistsStr,
      label,
      genre,
    });
  });
  
  return tracks;
}

function getPageTitle() {
  const h1 = document.querySelector('h1');
  if (h1) return h1.textContent?.trim() || '';
  
  const titleElem = document.querySelector('.ch-top-title, .page-title');
  if (titleElem) return titleElem.textContent?.trim() || '';
  
  return document.title.replace(' | Traxsource', '').trim();
}

function hasTracksOnPage() {
  return document.querySelectorAll('#trkListCont .trk-row').length > 0;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTracks') {
    const tracks = parseTracks();
    const pageTitle = getPageTitle();
    sendResponse({ 
      tracks, 
      pageTitle,
      url: window.location.href,
      hasTracks: tracks.length > 0
    });
  } else if (request.action === 'checkPage') {
    sendResponse({ 
      hasTracks: hasTracksOnPage(),
      trackCount: document.querySelectorAll('#trkListCont .trk-row').length,
      url: window.location.href
    });
  }
  return true;
});

console.log('[Trax→YT] Loaded, tracks:', hasTracksOnPage() ? parseTracks().length : 0);
