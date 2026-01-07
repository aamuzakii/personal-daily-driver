

async function fetchJson(url: string): Promise<any> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getUploadsPlaylistId(channelId: string, apiKey: string): Promise<string> {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${encodeURIComponent(channelId)}&key=${encodeURIComponent(apiKey)}`;
  const data = await fetchJson(url);
  const items = Array.isArray(data?.items) ? data.items : [];
  if (items.length === 0) throw new Error('Channel not found');
  const uploads = items[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads || typeof uploads !== 'string') throw new Error('Uploads playlist not found');
  return uploads;
}

export async function fetchChannelVideoUrls(params: { channelId: string; maxPages?: number; pageSize?: number }): Promise<string[]> {
  const { channelId } = params;
  const maxPages = Math.max(1, Math.min(params.maxPages ?? 2, 5));
  const pageSize = Math.max(1, Math.min(params.pageSize ?? 25, 50));
  const apiKey = 'AIzaSyCvaJfc_XzpcBp8oINEhMgfuuWhKkyRqGA'
  if (!apiKey) {
    console.log('YT_API_KEY not set. Set env YT_API_KEY or expo extra YT_API_KEY.');
    return [];
  }

  const uploadsId = await getUploadsPlaylistId(channelId, apiKey);
  let pageToken: string | undefined = undefined;
  const videoIds: string[] = [];

  for (let page = 0; page < maxPages; page++) {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('playlistId', uploadsId);
    url.searchParams.set('maxResults', String(pageSize));
    url.searchParams.set('key', apiKey);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const data = await fetchJson(url.toString());
    const items: any[] = Array.isArray(data?.items) ? data.items : [];
    for (const it of items) {
      const vid = it?.contentDetails?.videoId;
      if (typeof vid === 'string' && vid.length > 0) videoIds.push(vid);
    }
    pageToken = typeof data?.nextPageToken === 'string' ? data.nextPageToken : undefined;
    if (!pageToken) break;
  }

  return videoIds.map((id) => `https://www.youtube.com/watch?v=${id}`);
}
