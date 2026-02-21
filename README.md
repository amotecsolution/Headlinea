# Headlinea 🌍
Global News Aggregator for Technology, Economics & World Trends  
*Built from Hong Kong for the global community*

## Overview
Headlinea is a responsive web application that aggregates news from 20+ trusted sources across three key areas:
- **Latest Technologies** (AI, emerging tech, startups, hardware)
- **Economic Trends & Business Models** (markets, trade policy, geopolitics)
- **Global Trends & World News** (breaking stories, regional perspectives)

## Features
✨ **Responsive Design** - Works seamlessly on desktop, tablet, and mobile  
🔄 **Real-time Updates** - Auto-refresh every 60 seconds (configurable)  
🔍 **Smart Search** - Search across all articles and sources  
📂 **Category Filtering** - Filter by technology, economy, or world news  
📊 **Source Status** - Monitor feed health and update frequency  
💾 **Caching** - Deduplicates articles and avoids redundant fetches  

## Tech Stack
- **HTML5** - Semantic markup
- **CSS3** - Responsive grid layout, animations, dark-mode ready
- **Vanilla JavaScript** - No dependencies (lightweight & fast)
- **RSS-to-JSON API** - CORS-friendly feed parsing

## Quick Start

### Option 1: Local Development (Recommended)
```bash
# Start a local HTTP server (Python 3)
python3 -m http.server 8000

# Or using Node.js with http-server
npx http-server -p 8000

# Or using macOS with PHP
php -S localhost:8000
```
Then open: http://localhost:8000

### Option 2: Direct File Access
Simply open `index.html` in your browser (⚠️ may have CORS issues)

## File Structure
```
Headlinea/
├── index.html          # Main HTML structure
├── styles.css          # Responsive styling
├── app.js             # News fetching & rendering logic
├── source.json        # News source configuration
└── README.md          # This file
```

## Configuration

### Adjusting Refresh Interval (`app.js`)
```javascript
const CONFIG = {
    refreshInterval: 60000,  // 60 seconds - adjust as needed
    maxArticlesPerFeed: 10,  // Articles per source
    cacheExpiry: 3600000,    // 1 hour
};
```

### Adding/Removing News Sources (`source.json`)
Edit the `source.json` file to customize your RSS feeds:
```json
{
  "topics": {
    "latest_technologies": [
      {
        "name": "Your Source",
        "description": "Description",
        "rss": "https://example.com/feed",
        "note": "Optional notes"
      }
    ]
  }
}
```

### CORS Proxy Options
If the default CORS proxy fails, uncomment alternatives in `app.js`:
```javascript
// cors_proxy: 'https://api.rss2json.com/v1/api.json?rss_url=',
```

## Usage

### Keyboard Shortcuts
- `Cmd/Ctrl + K` - Focus search
- `Cmd/Ctrl + R` - Refresh feeds

### Filter Options
- **All News** - Complete feed
- **Technology** - Latest tech & startups
- **Economy** - Markets & business models
- **World News** - Global events & trends

### Search
Type keywords to search across all article titles, descriptions, and sources

### Auto-Refresh
Toggle auto-refresh in the sidebar (default: enabled)

## API Integration
The app uses **rss2json.com** API to convert RSS feeds to JSON:
- Converts RSS to JSON format
- Handles CORS restrictions
- Free tier available (no authentication)

## Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Performance Tips
1. **Adjust refresh interval** if you have rate-limit issues
2. **Reduce max articles per feed** to speed up loading
3. **Use a service worker** for offline support (optional future enhancement)

## Troubleshooting

### "CORS Error" or "Failed to load"
- Check your internet connection
- Try a different CORS proxy (listed in app.js)
- Wait a moment and refresh (API rate limits)

### Feeds Not Updating
- Verify RSS URLs are valid in source.json
- Check browser console for specific error messages
- Some sources may require subscription/API keys

### Slow Performance
- Reduce `maxArticlesPerFeed` in CONFIG
- Increase `refreshInterval` time
- Clear browser cache and reload

## Future Enhancements
- 🔔 Push notifications for breaking news
- 🌙 Dark mode toggle
- ❤️ Save/bookmark favorite articles
- 💾 Service worker for offline support
- 🧠 AI-powered content summarization
- 🗣️ Sentiment analysis on trends

## License
Personal project. Feel free to fork and adapt for your needs.

## Contact
Built from Andrew MOU
