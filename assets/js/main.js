const ARTICLE_URLS = [
  'https://medium.com/@andy.gfg96/merge-squash-and-rebase-7043f017449',
  'https://medium.com/@andy.gfg96/web-accessibility-and-good-practices-cbeb0ae71b5b'
];

const MICROLINK_BASE = 'https://api.microlink.io';
const CARDS_CONTAINER_ID = 'article-cards';

async function fetchOGData(url) {
  const key = `og_${url}`;
  const cached = sessionStorage.getItem(key);
  if (cached) return JSON.parse(cached);

  const apiUrl = `${MICROLINK_BASE}?url=${encodeURIComponent(url)}`;
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`Microlink ${response.status}`);
  const json = await response.json();
  if (json.status !== 'success') throw new Error('Microlink non-success');

  sessionStorage.setItem(key, JSON.stringify(json.data));
  return json.data;
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

function buildArticleCard(data, originalUrl) {
  const card = document.createElement('a');
  card.className = 'article-card card';
  card.href = data.url || originalUrl;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';
  card.setAttribute('aria-label', data.title || 'Read article');

  if (data.image?.url) {
    const img = document.createElement('img');
    img.className = 'article-card__image';
    img.src = data.image.url;
    img.alt = '';
    img.loading = 'lazy';
    card.appendChild(img);
  }

  if (data.publisher) {
    const pub = document.createElement('p');
    pub.className = 'article-card__publisher';
    pub.textContent = data.publisher;
    card.appendChild(pub);
  }

  const title = document.createElement('h3');
  title.className = 'article-card__title';
  title.textContent = data.title || 'Read Article';
  card.appendChild(title);

  if (data.description) {
    const desc = document.createElement('p');
    desc.className = 'article-card__description';
    desc.textContent = data.description;
    card.appendChild(desc);
  }

  return card;
}

function buildFallbackCard(url) {
  const card = document.createElement('a');
  card.className = 'article-card card';
  card.href = url;
  card.target = '_blank';
  card.rel = 'noopener noreferrer';

  const title = document.createElement('h3');
  title.className = 'article-card__title';
  title.textContent = 'Read Article on Medium';
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

  const skeletons = ARTICLE_URLS.map(() => {
    const skeleton = buildSkeletonCard();
    container.appendChild(skeleton);
    return skeleton;
  });

  const results = await Promise.allSettled(
    ARTICLE_URLS.map(url => fetchOGData(url))
  );

  results.forEach((result, i) => {
    const realCard =
      result.status === 'fulfilled'
        ? buildArticleCard(result.value, ARTICLE_URLS[i])
        : buildFallbackCard(ARTICLE_URLS[i]);

    container.replaceChild(realCard, skeletons[i]);
  });
}

document.addEventListener('DOMContentLoaded', initArticleCards);
