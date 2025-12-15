// YouTube search via scraping ytInitialData

function parseDurationText(str) {
  if (!str) return 0;
  const parts = str.split(':').map((p) => parseInt(p, 10) || 0);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function extractVideosFromYtData(ytData) {
  const videos = [];

  try {
    const contents =
      ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
        ?.contents;

    if (!contents) {
      console.warn('Unexpected YT structure');
      return videos;
    }

    for (const section of contents) {
      const items = section?.itemSectionRenderer?.contents;
      if (!items) continue;

      for (const item of items) {
        if (item.videoRenderer) {
          const video = item.videoRenderer;

          const videoId = video.videoId;
          const title = video.title?.runs?.[0]?.text || video.title?.simpleText || '';
          const durationText = video.lengthText?.simpleText || '0:00';
          const duration = parseDurationText(durationText);
          const channel = video.ownerText?.runs?.[0]?.text || '';
          const viewCount = video.viewCountText?.simpleText || '';

          // skip clips (<1min) and mixes (>15min)
          if (duration >= 60 && duration <= 900) {
            videos.push({ videoId, title, duration, durationText, channel, viewCount });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error extracting videos:', err);
  }

  return videos.slice(0, 10);
}

function findBestDurationMatch(videos, targetDuration) {
  return videos.reduce((best, video) => {
    const currentDiff = Math.abs(video.duration - targetDuration);
    const bestDiff = Math.abs(best.duration - targetDuration);
    return currentDiff < bestDiff ? video : best;
  });
}

async function searchYouTube(query, trackDuration = 0) {
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(searchUrl, {
      credentials: 'include',
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.error(`YT status ${response.status}`);
      return null;
    }

    const html = await response.text();
    const ytDataMatch = html.match(/var\s+ytInitialData\s*=\s*({.+?});\s*<\/script>/s);

    if (!ytDataMatch) {
      console.error('ytInitialData not found');
      return null;
    }

    let ytData;
    try {
      ytData = JSON.parse(ytDataMatch[1]);
    } catch (e) {
      console.error('JSON parse error:', e);
      return null;
    }

    const videos = extractVideosFromYtData(ytData);

    if (videos.length === 0) {
      console.log(`No results for: ${query}`);
      return null;
    }

    if (trackDuration > 0) {
      const bestMatch = findBestDurationMatch(videos, trackDuration);
      const diff = Math.abs(bestMatch.duration - trackDuration);
      console.log(`Match: "${bestMatch.title.substring(0, 40)}" (diff: ${diff}s)`);
      return bestMatch;
    }

    return videos[0];
  } catch (err) {
    console.error(`Search error "${query}":`, err);
    return null;
  }
}

function generatePlaylistUrl(videoIds) {
  return `https://youtube.com/watch_videos?video_ids=${videoIds.join(',')}`;
}

async function convertTracksToPlaylist(tracks, onProgress) {
  const videoIds = [];
  const results = [];

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];

    const queryParts = [];
    if (track.artists) queryParts.push(track.artists);
    if (track.title) queryParts.push(track.title);
    if (track.version) queryParts.push(track.version);

    const query = queryParts.join(' - ');

    if (!query) {
      results.push({ index: i, status: 'skipped', reason: 'no query' });
      onProgress({ current: i + 1, total: tracks.length, track, status: 'skipped' });
      continue;
    }

    onProgress({ current: i + 1, total: tracks.length, track, status: 'searching', query });

    const result = await searchYouTube(query, track.durationSeconds || 0);

    if (result?.videoId) {
      videoIds.push(result.videoId);
      const durationDiff = track.durationSeconds
        ? Math.abs(result.duration - track.durationSeconds)
        : 0;

      results.push({
        index: i,
        status: 'found',
        videoId: result.videoId,
        videoTitle: result.title,
        videoDuration: result.duration,
        durationDiff,
      });

      onProgress({
        current: i + 1,
        total: tracks.length,
        track,
        status: 'found',
        videoId: result.videoId,
        videoTitle: result.title,
        durationDiff,
      });
    } else {
      results.push({ index: i, status: 'not_found' });
      onProgress({ current: i + 1, total: tracks.length, track, status: 'not_found' });
    }

    // small delay to avoid rate limiting
    const delay = 400 + Math.random() * 200;
    await new Promise((r) => setTimeout(r, delay));
  }

  const playlistUrl = videoIds.length > 0 ? generatePlaylistUrl(videoIds) : null;

  return { playlistUrl, found: videoIds.length, total: tracks.length, results };
}

const conversionState = {
  isRunning: false,
  current: 0,
  total: 0,
  lastProgress: null,
  result: null,
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startConversion') {
    if (conversionState.isRunning) {
      sendResponse({ error: 'Conversion already in progress' });
      return true;
    }

    conversionState.isRunning = true;
    conversionState.result = null;

    const tracks = request.tracks;

    convertTracksToPlaylist(tracks, (progress) => {
      conversionState.current = progress.current;
      conversionState.total = progress.total;
      conversionState.lastProgress = progress;

      chrome.runtime.sendMessage({ type: 'progress', ...progress }).catch(() => {});
    })
      .then((result) => {
        conversionState.isRunning = false;
        conversionState.result = result;

        chrome.storage.local.set({ lastResult: result, lastTimestamp: Date.now() });
        chrome.runtime.sendMessage({ type: 'complete', ...result }).catch(() => {});
      })
      .catch((error) => {
        conversionState.isRunning = false;
        chrome.runtime.sendMessage({ type: 'error', message: error.message }).catch(() => {});
      });

    sendResponse({ started: true });
    return true;
  }

  if (request.action === 'getState') {
    sendResponse({
      isRunning: conversionState.isRunning,
      current: conversionState.current,
      total: conversionState.total,
      lastProgress: conversionState.lastProgress,
      result: conversionState.result,
    });
    return true;
  }

  if (request.action === 'getLastResult') {
    chrome.storage.local.get(['lastResult', 'lastTimestamp'], (data) => {
      sendResponse(data);
    });
    return true;
  }

  return false;
});

console.log('[Trax→YT] Background loaded');
