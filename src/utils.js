/**
 * Utility functions for Traxsource to YouTube extension
 * These are pure functions that can be unit tested
 */

/**
 * Parse duration string to seconds
 * Handles formats: "5:30", "1:05:30", "(5:30)"
 * @param {string} str - Duration string
 * @returns {number} Duration in seconds
 */
export function parseDuration(str) {
  if (!str) return 0;

  str = str.trim().replace(/[()]/g, '');
  const parts = str.split(':').map((p) => parseInt(p, 10) || 0);

  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];

  return 0;
}

/**
 * Format seconds to duration string
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration "5:30" or "1:05:30"
 */
export function formatDuration(seconds) {
  if (seconds <= 0) return '0:00';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Extract video data from YouTube's ytInitialData JSON
 * @param {object} ytData - YouTube initial data object
 * @returns {Array} Array of video objects
 */
export function extractVideosFromYtData(ytData) {
  const videos = [];

  try {
    const contents =
      ytData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
        ?.contents;

    if (!contents) {
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
          const duration = parseDuration(durationText);
          const channel = video.ownerText?.runs?.[0]?.text || '';
          const viewCount = video.viewCountText?.simpleText || '';

          // skip clips (<1min) and mixes (>15min)
          if (duration >= 60 && duration <= 900) {
            videos.push({ videoId, title, duration, durationText, channel, viewCount });
          }
        }
      }
    }
  } catch {
    // Return empty array on error
    return [];
  }

  return videos.slice(0, 10);
}

/**
 * Find the video with duration closest to target
 * @param {Array} videos - Array of video objects with duration property
 * @param {number} targetDuration - Target duration in seconds
 * @returns {object} Video object with closest duration
 */
export function findBestDurationMatch(videos, targetDuration) {
  if (!videos || videos.length === 0) return null;

  return videos.reduce((best, video) => {
    const currentDiff = Math.abs(video.duration - targetDuration);
    const bestDiff = Math.abs(best.duration - targetDuration);
    return currentDiff < bestDiff ? video : best;
  });
}

/**
 * Generate YouTube playlist URL from video IDs
 * @param {Array<string>} videoIds - Array of YouTube video IDs
 * @returns {string} Playlist URL
 */
export function generatePlaylistUrl(videoIds) {
  if (!videoIds || videoIds.length === 0) return '';
  return `https://youtube.com/watch_videos?video_ids=${videoIds.join(',')}`;
}
