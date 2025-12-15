import { describe, test, expect } from 'vitest';
import {
  parseDuration,
  formatDuration,
  extractVideosFromYtData,
  findBestDurationMatch,
  generatePlaylistUrl,
} from '../../src/utils.js';
import youtubeMock from '../fixtures/youtube-mock.json';

describe('parseDuration', () => {
  test('parses mm:ss format', () => {
    expect(parseDuration('5:30')).toBe(330);
  });

  test('parses single digit minutes', () => {
    expect(parseDuration('1:00')).toBe(60);
  });

  test('parses hh:mm:ss format', () => {
    expect(parseDuration('1:05:30')).toBe(3930);
  });

  test('handles empty string', () => {
    expect(parseDuration('')).toBe(0);
  });

  test('handles null/undefined', () => {
    expect(parseDuration(null)).toBe(0);
    expect(parseDuration(undefined)).toBe(0);
  });

  test('handles parentheses from Traxsource', () => {
    expect(parseDuration('(5:30)')).toBe(330);
  });

  test('handles whitespace', () => {
    expect(parseDuration('  5:30  ')).toBe(330);
  });

  test('handles invalid format', () => {
    expect(parseDuration('invalid')).toBe(0);
  });
});

describe('formatDuration', () => {
  test('formats seconds to mm:ss', () => {
    expect(formatDuration(330)).toBe('5:30');
  });

  test('formats with leading zero on seconds', () => {
    expect(formatDuration(301)).toBe('5:01');
  });

  test('formats with hours', () => {
    expect(formatDuration(3930)).toBe('1:05:30');
  });

  test('handles zero', () => {
    expect(formatDuration(0)).toBe('0:00');
  });

  test('handles negative values', () => {
    expect(formatDuration(-10)).toBe('0:00');
  });

  test('formats exactly one minute', () => {
    expect(formatDuration(60)).toBe('1:00');
  });

  test('formats exactly one hour', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
  });
});

describe('extractVideosFromYtData', () => {
  test('extracts videos from valid YouTube data', () => {
    const videos = extractVideosFromYtData(youtubeMock);
    expect(videos.length).toBeGreaterThan(0);
  });

  test('returns video objects with required properties', () => {
    const videos = extractVideosFromYtData(youtubeMock);
    expect(videos[0]).toHaveProperty('videoId');
    expect(videos[0]).toHaveProperty('title');
    expect(videos[0]).toHaveProperty('duration');
    expect(videos[0]).toHaveProperty('durationText');
    expect(videos[0]).toHaveProperty('channel');
  });

  test('filters out videos shorter than 60 seconds', () => {
    const videos = extractVideosFromYtData(youtubeMock);
    videos.forEach((video) => {
      expect(video.duration).toBeGreaterThanOrEqual(60);
    });
  });

  test('filters out videos longer than 15 minutes (900s)', () => {
    const videos = extractVideosFromYtData(youtubeMock);
    videos.forEach((video) => {
      expect(video.duration).toBeLessThanOrEqual(900);
    });
  });

  test('returns max 10 videos', () => {
    const videos = extractVideosFromYtData(youtubeMock);
    expect(videos.length).toBeLessThanOrEqual(10);
  });

  test('handles null/undefined input', () => {
    expect(extractVideosFromYtData(null)).toEqual([]);
    expect(extractVideosFromYtData(undefined)).toEqual([]);
  });

  test('handles empty object', () => {
    expect(extractVideosFromYtData({})).toEqual([]);
  });

  test('handles malformed data structure', () => {
    const malformed = { contents: { something: 'else' } };
    expect(extractVideosFromYtData(malformed)).toEqual([]);
  });
});

describe('findBestDurationMatch', () => {
  const mockVideos = [
    { videoId: 'a', title: 'Track A', duration: 300 },
    { videoId: 'b', title: 'Track B', duration: 330 },
    { videoId: 'c', title: 'Track C', duration: 360 },
  ];

  test('finds exact duration match', () => {
    const result = findBestDurationMatch(mockVideos, 330);
    expect(result.videoId).toBe('b');
  });

  test('finds closest match when no exact match', () => {
    const result = findBestDurationMatch(mockVideos, 325);
    expect(result.videoId).toBe('b');
  });

  test('prefers earlier video when tied', () => {
    const result = findBestDurationMatch(mockVideos, 315);
    // 315 is equidistant from 300 and 330, reduce picks first (300)
    expect(result.videoId).toBe('a');
  });

  test('handles single video array', () => {
    const single = [{ videoId: 'x', duration: 200 }];
    const result = findBestDurationMatch(single, 500);
    expect(result.videoId).toBe('x');
  });

  test('handles empty array', () => {
    expect(findBestDurationMatch([], 300)).toBeNull();
  });

  test('handles null/undefined', () => {
    expect(findBestDurationMatch(null, 300)).toBeNull();
    expect(findBestDurationMatch(undefined, 300)).toBeNull();
  });
});

describe('generatePlaylistUrl', () => {
  test('generates valid URL with single video', () => {
    const url = generatePlaylistUrl(['abc123']);
    expect(url).toBe('https://youtube.com/watch_videos?video_ids=abc123');
  });

  test('generates valid URL with multiple videos', () => {
    const url = generatePlaylistUrl(['abc123', 'def456', 'ghi789']);
    expect(url).toBe('https://youtube.com/watch_videos?video_ids=abc123,def456,ghi789');
  });

  test('handles empty array', () => {
    expect(generatePlaylistUrl([])).toBe('');
  });

  test('handles null/undefined', () => {
    expect(generatePlaylistUrl(null)).toBe('');
    expect(generatePlaylistUrl(undefined)).toBe('');
  });
});
