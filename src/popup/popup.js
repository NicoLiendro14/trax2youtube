let currentTracks = [];
let playlistUrl = null;
let isConverting = false;

const elements = {
  content: document.getElementById('content'),
  notTraxsource: document.getElementById('notTraxsource'),
  statusCard: document.getElementById('statusCard'),
  statusIcon: document.getElementById('statusIcon'),
  statusText: document.getElementById('statusText'),
  progressContainer: document.getElementById('progressContainer'),
  progressFill: document.getElementById('progressFill'),
  progressLabel: document.getElementById('progressLabel'),
  trackInfo: document.getElementById('trackInfo'),
  trackCount: document.getElementById('trackCount'),
  chartTitle: document.getElementById('chartTitle'),
  convertBtn: document.getElementById('convertBtn'),
  resultCard: document.getElementById('resultCard'),
  resultStats: document.getElementById('resultStats'),
  openPlaylistBtn: document.getElementById('openPlaylistBtn'),
  copyUrlBtn: document.getElementById('copyUrlBtn'),
  errorCard: document.getElementById('errorCard'),
  errorMessage: document.getElementById('errorMessage'),
  retryBtn: document.getElementById('retryBtn'),
};

async function init() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url || !tab.url.includes('traxsource.com')) {
      showNotTraxsource();
      return;
    }

    const state = await sendMessageToBackground({ action: 'getState' });
    if (state && state.isRunning) {
      showConverting();
      updateProgress(state.lastProgress);
      return;
    }

    const lastData = await sendMessageToBackground({ action: 'getLastResult' });
    if (lastData.lastResult && lastData.lastSourceUrl === tab.url) {
      playlistUrl = lastData.lastResult.playlistUrl;
      showComplete(lastData.lastResult);
      return;
    }

    await loadTracksFromPage(tab.id);
  } catch (err) {
    console.error('Init error:', err);
    showError('Initialization error. Please reload the Traxsource page.');
  }
}

async function loadTracksFromPage(tabId) {
  updateStatus('⏳', 'Analyzing page...');

  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'getTracks' });

    if (!response || !response.tracks || response.tracks.length === 0) {
      showNoTracks();
      return;
    }

    currentTracks = response.tracks;
    showReadyToConvert(response.tracks.length, response.pageTitle);
  } catch (err) {
    console.error('Error getting tracks:', err);
    showError('Could not read the page. Make sure you are on a Traxsource chart and reload.');
  }
}

function updateStatus(icon, text) {
  elements.statusIcon.textContent = icon;
  elements.statusText.textContent = text;
}

function showNotTraxsource() {
  elements.content.style.display = 'none';
  elements.notTraxsource.style.display = 'block';
}

function showNoTracks() {
  updateStatus('🔍', 'No tracks found on this page');
  elements.trackInfo.style.display = 'none';
  elements.convertBtn.style.display = 'none';
}

function showReadyToConvert(count, title) {
  updateStatus('✅', 'Ready to convert');

  elements.trackInfo.style.display = 'block';
  elements.trackCount.textContent = count;
  elements.chartTitle.textContent = title || 'Traxsource Chart';

  elements.convertBtn.style.display = 'flex';
  elements.convertBtn.disabled = false;
  elements.convertBtn.querySelector('.btn-text').textContent = `Convert ${count} tracks`;

  elements.progressContainer.style.display = 'none';
  elements.progressLabel.style.display = 'none';
  elements.resultCard.style.display = 'none';
  elements.errorCard.style.display = 'none';
}

function showConverting() {
  isConverting = true;
  elements.statusCard.classList.add('searching');
  updateStatus('🔍', 'Searching on YouTube...');

  elements.convertBtn.style.display = 'flex';
  elements.convertBtn.disabled = true;
  elements.convertBtn.querySelector('.btn-text').textContent = 'Converting...';

  elements.progressContainer.style.display = 'block';
  elements.progressLabel.style.display = 'block';
  elements.resultCard.style.display = 'none';
  elements.errorCard.style.display = 'none';
}

function formatTrackDisplay(track) {
  if (!track) return '';

  const parts = [];
  if (track.artists) parts.push(track.artists);
  if (track.title) parts.push(track.title);

  let display = parts.join(' - ');
  if (track.version) display += ` (${track.version})`;

  return display;
}

function updateProgress(progress) {
  if (!progress) return;

  const percent = Math.round((progress.current / progress.total) * 100);
  elements.progressFill.style.width = `${percent}%`;
  elements.progressLabel.textContent = `${progress.current} / ${progress.total} tracks`;

  const trackDisplay = formatTrackDisplay(progress.track);
  const status = progress.status === 'found' ? '✅' : progress.status === 'not_found' ? '❌' : '🔍';

  updateStatus(
    status,
    trackDisplay.length > 40 ? trackDisplay.substring(0, 40) + '...' : trackDisplay
  );
}

function showComplete(result) {
  isConverting = false;
  elements.statusCard.classList.remove('searching');

  playlistUrl = result.playlistUrl;

  updateStatus('🎉', 'Conversion complete!');

  elements.convertBtn.style.display = 'none';
  elements.progressContainer.style.display = 'none';
  elements.progressLabel.style.display = 'none';

  elements.resultCard.style.display = 'block';
  elements.resultStats.textContent = `${result.found} of ${result.total} tracks found`;

  elements.errorCard.style.display = 'none';
}

function showError(message) {
  isConverting = false;
  elements.statusCard.classList.remove('searching');

  updateStatus('❌', 'Error');

  elements.convertBtn.style.display = 'none';
  elements.progressContainer.style.display = 'none';
  elements.progressLabel.style.display = 'none';
  elements.resultCard.style.display = 'none';

  elements.errorCard.style.display = 'block';
  elements.errorMessage.textContent = message;
}

async function startConversion() {
  if (isConverting || currentTracks.length === 0) return;

  showConverting();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const response = await sendMessageToBackground({
      action: 'startConversion',
      tracks: currentTracks,
      sourceUrl: tab.url,
    });

    if (response.error) {
      showError(response.error);
    }
  } catch (err) {
    console.error('Conversion error:', err);
    showError('Error starting the conversion');
  }
}

function sendMessageToBackground(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      resolve(response || {});
    });
  });
}

function openPlaylist() {
  if (playlistUrl) {
    chrome.tabs.create({ url: playlistUrl });
  }
}

async function copyUrl() {
  if (!playlistUrl) return;

  try {
    await navigator.clipboard.writeText(playlistUrl);

    const btn = elements.copyUrlBtn;
    const originalText = btn.querySelector('.btn-text').textContent;
    btn.querySelector('.btn-text').textContent = 'Copied!';
    btn.querySelector('.btn-icon').textContent = '✅';

    setTimeout(() => {
      btn.querySelector('.btn-text').textContent = originalText;
      btn.querySelector('.btn-icon').textContent = '📋';
    }, 2000);
  } catch (err) {
    console.error('Copy failed:', err);
  }
}

async function retry() {
  elements.errorCard.style.display = 'none';

  if (currentTracks.length > 0) {
    showReadyToConvert(currentTracks.length, elements.chartTitle.textContent);
  } else {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await loadTracksFromPage(tab.id);
  }
}

document.addEventListener('DOMContentLoaded', init);

elements.convertBtn.addEventListener('click', startConversion);
elements.openPlaylistBtn.addEventListener('click', openPlaylist);
elements.copyUrlBtn.addEventListener('click', copyUrl);
elements.retryBtn.addEventListener('click', retry);

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'progress') {
    updateProgress(message);
  } else if (message.type === 'complete') {
    showComplete(message);
  } else if (message.type === 'error') {
    showError(message.message);
  }
});
