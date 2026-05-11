const MEDIUM_USERNAME    = 'andy.gfg96';
const RSS_FEED_URL       = `https://medium.com/feed/@${MEDIUM_USERNAME}`;
const RSS2JSON_BASE      = 'https://api.rss2json.com/v1/api.json';
const MAX_ARTICLES       = 6;
const CARDS_CONTAINER_ID = 'article-cards';
const PLACEHOLDER_IMG    =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' " +
  "height='450' viewBox='0 0 800 450'%3E%3Crect width='800' height='450' " +
  "fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' " +
  "text-anchor='middle' font-family='sans-serif' font-size='48' " +
  "fill='%237c3aed'%3EM%3C/text%3E%3C/svg%3E";

async function fetchRSSArticles() {
  const cacheKey = 'rss_medium_articles';
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return JSON.parse(cached);

  const params = new URLSearchParams({ rss_url: RSS_FEED_URL });
  const res = await fetch(`${RSS2JSON_BASE}?${params}`);
  if (!res.ok) throw new Error(`rss2json HTTP ${res.status}`);
  const json = await res.json();
  if (json.status !== 'ok') throw new Error(`rss2json error: ${json.message || 'unknown'}`);

  const items = json.items.slice(0, MAX_ARTICLES);
  sessionStorage.setItem(cacheKey, JSON.stringify(items));
  return items;
}

function extractImgFromHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  for (const img of tmp.querySelectorAll('img')) {
    if (!img.src.includes('medium.com/_/stat')) return img.src;
  }
  return null;
}

function stripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim();
}

function truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen).trimEnd() + '…' : str;
}

function formatDate(pubDate) {
  const d = new Date(pubDate);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildSkeletonCard() {
  const card = document.createElement('div');
  card.className = 'article-card card article-card--skeleton';

  const img = document.createElement('div');
  img.className = 'article-card__image article-card__image--skeleton';
  card.appendChild(img);

  const pub = document.createElement('div');
  pub.className = 'article-card__publisher article-card__skeleton-line';
  card.appendChild(pub);

  const title = document.createElement('div');
  title.className = 'article-card__title article-card__skeleton-line';
  card.appendChild(title);

  const desc = document.createElement('div');
  desc.className = 'article-card__description article-card__skeleton-line';
  card.appendChild(desc);

  return card;
}

function buildArticleCard(item) {
  const card = document.createElement('a');
  card.className = 'article-card card';
  card.href = item.link;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.setAttribute('aria-label', item.title || 'Read article on Medium');

  const img = document.createElement('img');
  img.className = 'article-card__image';
  img.src = item.thumbnail || extractImgFromHtml(item.description) || PLACEHOLDER_IMG;
  img.alt = '';
  img.loading = 'lazy';
  card.appendChild(img);

  const body = document.createElement('div');
  body.className = 'article-card__body';

  const pub = document.createElement('p');
  pub.className = 'article-card__publisher';
  pub.textContent = 'Medium';
  body.appendChild(pub);

  const title = document.createElement('h3');
  title.className = 'article-card__title';
  title.textContent = item.title || 'Read Article';
  body.appendChild(title);

  const rawText = stripHtml(item.description || '');
  if (rawText) {
    const desc = document.createElement('p');
    desc.className = 'article-card__description';
    desc.textContent = truncate(rawText, 160);
    body.appendChild(desc);
  }

  const dateStr = formatDate(item.pubDate);
  if (dateStr) {
    const date = document.createElement('p');
    date.className = 'article-card__date';
    date.textContent = dateStr;
    body.appendChild(date);
  }

  card.appendChild(body);
  return card;
}

function buildFallbackCard() {
  const url = `https://medium.com/@${MEDIUM_USERNAME}`;
  const card = document.createElement('a');
  card.className = 'article-card card';
  card.href = url;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  const title = document.createElement('h3');
  title.className = 'article-card__title';
  title.textContent = 'View Articles on Medium';
  card.appendChild(title);

  const desc = document.createElement('p');
  desc.className = 'article-card__description';
  desc.textContent = url;
  card.appendChild(desc);

  return card;
}

async function initArticleCards() {
  const container = document.getElementById(CARDS_CONTAINER_ID);
  if (!container) return;

  const skeletons = Array.from({ length: MAX_ARTICLES }, () => {
    const s = buildSkeletonCard();
    container.appendChild(s);
    return s;
  });

  let items = [];
  try {
    items = await fetchRSSArticles();
  } catch (err) {
    console.error('Failed to load Medium articles:', err);
    skeletons.forEach(s => container.removeChild(s));
    container.appendChild(buildFallbackCard());
    return;
  }

  skeletons.forEach((skeleton, i) => {
    if (i < items.length) {
      container.replaceChild(buildArticleCard(items[i]), skeleton);
    } else {
      container.removeChild(skeleton);
    }
  });
}

document.addEventListener('DOMContentLoaded', initArticleCards);
