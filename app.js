// ==================== Configuration ==================== 
const CONFIG = {
    cors_proxy: 'https://cors-anywhere.herokuapp.com/',
    // Alternative CORS proxies (uncomment one if the above doesn't work):
    // cors_proxy: 'https://api.rss2json.com/v1/api.json?rss_url=',
    refreshInterval: 60000, // 60 seconds
    maxArticlesPerFeed: 10,
    cacheExpiry: 3600000, // 1 hour
};

// ==================== State Management ==================== 
let appState = {
    sources: {},
    articles: [],
    filteredArticles: [],
    currentFilter: 'all',
    currentSearch: '',
    lastRefresh: null,
    feedStatus: {},
};

let autoRefreshTimer = null;

// ==================== Initialize App ==================== 
document.addEventListener('DOMContentLoaded', async () => {
    initializeEventListeners();
    await loadSources();
    await refreshNews();
    setupAutoRefresh();
});

// ==================== Event Listeners ==================== 
function initializeEventListeners() {
    // Filter buttons in navbar
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', handleFilterChange);
    });

    // Filter links in sidebar
    document.querySelectorAll('.topic-link').forEach(link => {
        link.addEventListener('click', handleFilterChange);
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', debounce(handleSearch, 300));
    document.getElementById('searchBtn').addEventListener('click', handleSearch);

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', refreshNews);

    // Auto-refresh checkbox
    document.getElementById('autoRefresh').addEventListener('change', setupAutoRefresh);

    // Modal
    document.getElementById('aboutLink').addEventListener('click', openAbout);
    document.querySelector('.close').addEventListener('click', closeAbout);
    window.addEventListener('click', outsideModlaClick);
}

function handleFilterChange(e) {
    e.preventDefault();
    const filter = e.target.getAttribute('data-filter');
    if (!filter) return;

    appState.currentFilter = filter;

    // Update active states
    document.querySelectorAll('.filter-btn, .topic-link').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelectorAll(`[data-filter="${filter}"]`).forEach(el => {
        el.classList.add('active');
    });

    filterAndDisplayArticles();
}

function handleSearch(e) {
    if (e.key && e.key !== 'Enter' && e.target.id !== 'searchBtn') return;
    
    appState.currentSearch = document.getElementById('searchInput').value.toLowerCase().trim();
    filterAndDisplayArticles();
}

function setupAutoRefresh() {
    const autoRefreshCheckbox = document.getElementById('autoRefresh');
    
    if (autoRefreshCheckbox.checked) {
        autoRefreshTimer = setInterval(refreshNews, CONFIG.refreshInterval);
    } else {
        if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }
    }
}

// ==================== Load Sources from source.json ==================== 
async function loadSources() {
    try {
        const response = await fetch('./source.json');
        const data = await response.json();
        appState.sources = data;
        initializeFeedStatus();
    } catch (error) {
        console.error('Error loading sources:', error);
        showError('Failed to load news sources');
    }
}

function initializeFeedStatus() {
    Object.entries(appState.sources.topics).forEach(([category, feeds]) => {
        feeds.forEach(feed => {
            appState.feedStatus[feed.name] = { status: 'pending', lastFetch: null };
        });
    });
}

// ==================== Fetch and Parse RSS Feeds ==================== 
async function refreshNews() {
    console.log('Refreshing news feeds...');
    updateLoadingState(true);
    appState.articles = [];
    appState.feedStatus = {};
    
    const feedPromises = [];

    Object.entries(appState.sources.topics).forEach(([category, feeds]) => {
        feeds.forEach(feed => {
            feedPromises.push(fetchFeed(feed, category));
        });
    });

    const results = await Promise.allSettled(feedPromises);
    
    results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
            appState.articles.push(...result.value);
        }
    });

    // Deduplicate and sort by date
    appState.articles = deduplicateArticles(appState.articles)
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    appState.lastRefresh = new Date();
    updateLoadingState(false);
    filterAndDisplayArticles();
    updateSourceStatus();
}

async function fetchFeed(feed, category) {
    try {
        // Use a CORS proxy or public RSS-to-JSON converter
        const rssUrl = encodeURIComponent(feed.rss);
        const corsUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;

        const response = await fetch(corsUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        
        if (!data.items) {
            appState.feedStatus[feed.name] = { 
                status: 'error', 
                message: 'No items found',
                lastFetch: new Date() 
            };
            return [];
        }

        const articles = data.items.slice(0, CONFIG.maxArticlesPerFeed).map(item => ({
            title: item.title || 'Untitled',
            description: item.description || item.content || 'No description available',
            link: item.link || feed.rss,
            source: feed.name,
            category: category,
            pubDate: new Date(item.pubDate || item.isoDate || Date.now()).toISOString(),
            author: item.author || 'Unknown',
            thumbnail: item.thumbnail || getThumbFromDescription(item.description),
            guid: item.guid || item.link,
        }));

        appState.feedStatus[feed.name] = { 
            status: 'success',
            count: articles.length,
            lastFetch: new Date() 
        };

        return articles;
    } catch (error) {
        console.error(`Error fetching ${feed.name}:`, error);
        appState.feedStatus[feed.name] = { 
            status: 'error', 
            message: error.message,
            lastFetch: new Date() 
        };
        return [];
    }
}

function getThumbFromDescription(description) {
    if (!description) return null;
    const imgRegex = /<img[^>]+src="([^">]+)"/g;
    const match = imgRegex.exec(description);
    return match ? match[1] : null;
}

function deduplicateArticles(articles) {
    const seen = new Map();
    const deduped = [];

    articles.forEach(article => {
        // Normalize title for better dedup
        const key = article.title.toLowerCase().trim();
        
        if (!seen.has(key)) {
            seen.set(key, true);
            deduped.push(article);
        }
    });

    return deduped;
}

// ==================== Filter and Display Logic ==================== 
function filterAndDisplayArticles() {
    let filtered = appState.articles;

    // Apply category filter
    if (appState.currentFilter !== 'all') {
        filtered = filtered.filter(article => article.category === appState.currentFilter);
    }

    // Apply search filter
    if (appState.currentSearch) {
        filtered = filtered.filter(article => 
            article.title.toLowerCase().includes(appState.currentSearch) ||
            article.description.toLowerCase().includes(appState.currentSearch) ||
            article.source.toLowerCase().includes(appState.currentSearch)
        );
    }

    appState.filteredArticles = filtered;
    renderArticles(filtered);
}

function renderArticles(articles) {
    const feed = document.getElementById('newsFeed');
    const noResults = document.getElementById('noResults');

    if (articles.length === 0) {
        feed.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    feed.innerHTML = articles.map(article => createArticleCard(article)).join('');
}

function createArticleCard(article) {
    const date = formatDate(new Date(article.pubDate));
    const categoryLabel = getCategoryLabel(article.category);

    return `
        <article class="article-card">
            <div class="article-header">
                <div class="article-source">${escapeHtml(article.source)}</div>
                <div class="article-category">${categoryLabel}</div>
                <h3 class="article-title">${escapeHtml(article.title)}</h3>
            </div>
            <div class="article-body">
                <p class="article-description">${sanitizeDescription(article.description)}</p>
            </div>
            <div class="article-footer">
                <span class="article-date">${date}</span>
                <a href="${escapeHtml(article.link)}" target="_blank" rel="noopener noreferrer" class="article-link">
                    Read Full Story →
                </a>
            </div>
        </article>
    `;
}

function getCategoryLabel(category) {
    const labels = {
        'latest_technologies': 'Technology',
        'economic_trends_and_business_models': 'Economy',
        'global_trends_world_news': 'World News',
    };
    return labels[category] || category;
}

function sanitizeDescription(html) {
    if (!html) return 'No description available';
    
    // Remove HTML tags but keep text
    const temp = document.createElement('div');
    temp.innerHTML = html;
    let text = temp.textContent || temp.innerText || '';
    
    // Limit to 200 characters
    if (text.length > 200) {
        text = text.substring(0, 200) + '...';
    }
    
    return escapeHtml(text);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== UI Updates ==================== 
function updateLoadingState(isLoading) {
    const loading = document.getElementById('loadingIndicator');
    if (isLoading) {
        loading.style.display = 'flex';
    } else {
        loading.style.display = 'none';
    }
}

function updateSourceStatus() {
    const statusContainer = document.getElementById('sourceStatus');
    let html = '<div>';
    
    const statuses = Object.values(appState.feedStatus);
    const successCount = statuses.filter(s => s.status === 'success').length;
    const errorCount = statuses.filter(s => s.status === 'error').length;
    
    html += `<p><strong>Sources:</strong></p>`;
    html += `<p>✅ ${successCount} active | ❌ ${errorCount} errors</p>`;
    html += `<p style="font-size: 0.8rem; color: var(--text-secondary);">Updated: ${formatDate(appState.lastRefresh)}</p>`;
    html += '</div>';
    
    statusContainer.innerHTML = html;
}

function showError(message) {
    console.error(message);
    // You could add a toast notification here
}

// ==================== Modal Functions ==================== 
function openAbout(e) {
    e.preventDefault();
    document.getElementById('aboutModal').style.display = 'block';
}

function closeAbout() {
    document.getElementById('aboutModal').style.display = 'none';
}

function outsideModlaClick(e) {
    const modal = document.getElementById('aboutModal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
}

// ==================== Utility Functions ==================== 
function formatDate(date) {
    if (!date) return 'Unknown date';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ==================== Keyboard Shortcuts ==================== 
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
    }
    
    // Ctrl/Cmd + R for refresh
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        refreshNews();
    }
});

console.log('Headlinea App initialized');
