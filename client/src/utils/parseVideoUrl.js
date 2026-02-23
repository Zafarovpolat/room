export function parseVideoUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, type: 'unknown' };
  }
  url = url.trim();

  // YouTube
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    return { valid: true, type: 'youtube', videoId: ytMatch[1], url };
  }

  // VK Video
  if (/vk\.com\/(video|clip)(-?\d+_\d+)/.test(url)) {
    return { valid: true, type: 'vk', url };
  }
  if (/vk\.com\/video_ext/.test(url)) {
    return { valid: true, type: 'vk', url };
  }

  // Rutube
  const rtMatch = url.match(/rutube\.ru\/video\/([a-f0-9]+)/);
  if (rtMatch) {
    return { valid: true, type: 'rutube', videoId: rtMatch[1], url };
  }
  if (/rutube\.ru\/play\/embed/.test(url)) {
    return { valid: true, type: 'rutube', url };
  }

  return { valid: false, type: 'unknown' };
}