// YouTube API Configuration
let API_KEY = '';
let currentCategory = 'mostPopular';
let nextPageToken = '';
let isLoading = false;
let player; // YouTube player instance
let currentVideoId = null;

// DOM Elements
const videosContainer = document.getElementById('videos-container');
const searchContainer = document.querySelector('.search-container');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const closeSearch = document.getElementById('close-search');
const searchBtn = document.querySelector('.search-btn');
const tabs = document.querySelectorAll('.tab');
const videoModal = document.querySelector('.video-modal');
const closeModal = document.getElementById('close-modal');
const loadingOverlay = document.getElementById('loading-overlay');
const videoPlayerContainer = document.getElementById('video-player');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // First, try to get API key from localStorage
    const savedApiKey = localStorage.getItem('youtube_api_key');

    if (savedApiKey && savedApiKey.length > 30) {
        API_KEY = savedApiKey;
        loadVideos();
        setupEventListeners();
        loadYouTubeIFrameAPI();
    } else {
        showApiKeyPrompt();
    }
});

// Load YouTube IFrame API
function loadYouTubeIFrameAPI() {
    // Check if already loaded
    if (window.YT && window.YT.Player) return;

    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// YouTube Player API callback - MUST be global
window.onYouTubeIframeAPIReady = function() {
    console.log('YouTube IFrame API ready');
    // Player will be created when showing video
};

// Create YouTube Player
function createYouTubePlayer(videoId) {
    // Destroy existing player
    if (player && player.destroy) {
        player.destroy();
    }

    currentVideoId = videoId;

    // Clear container
    videoPlayerContainer.innerHTML = '<div id="yt-player"></div>';

    // Get current origin
    const origin = window.location.origin || window.location.protocol + '//' + window.location.host;

    // Create new player
    player = new YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
            'autoplay': 1,
            'controls': 1,
            'rel': 0,
            'showinfo': 0,
            'modestbranding': 1,
            'playsinline': 1,
            'origin': origin,
            'enablejsapi': 1,
            'widget_referrer': origin
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange,
            'onError': onPlayerError
        }
    });
}

// Fallback method using direct iframe
function createDirectYouTubePlayer(videoId) {
    const origin = window.location.origin || window.location.protocol + '//' + window.location.host;

    videoPlayerContainer.innerHTML = `
        <iframe
            id="yt-player"
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1&rel=0&showinfo=0&modestbranding=1&playsinline=1&origin=${origin}&enablejsapi=1"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
            referrerpolicy="strict-origin-when-cross-origin">
        </iframe>
    `;

    // Store reference
    player = document.getElementById('yt-player');
}

function onPlayerReady(event) {
    console.log('Player ready, video loaded');
    event.target.playVideo();
}

function onPlayerStateChange(event) {
    const states = {
        '-1': 'unstarted',
        '0': 'ended',
        '1': 'playing',
        '2': 'paused',
        '3': 'buffering',
        '5': 'video cued'
    };
    console.log('Player state:', states[event.data] || 'unknown');
}

function onPlayerError(event) {
    console.error('Player error:', event.data);
    // Try direct iframe fallback
    if (currentVideoId) {
        createDirectYouTubePlayer(currentVideoId);
    }
}

// Show API Key prompt
function showApiKeyPrompt() {
    videosContainer.innerHTML = `
        <div class="welcome-screen">
            <div class="welcome-content">
                <i class="fab fa-youtube"></i>
                <h2>YouTube Clone</h2>
                <p>Enter YouTube API Key to Watch Videos</p>
                <div class="api-input-container">
                    <input type="text" id="api-key-input" placeholder="Paste API Key (AIzaSy...)" autocomplete="off">
                    <button id="save-api-btn" class="primary-btn">
                        <i class="fas fa-play-circle"></i> Start Watching
                    </button>
                </div>
                <div class="test-key">
                    <p>For testing, you can try (limited):</p>
                    <code>AIzaSyB-oGDf7zZ1_q8-PNqY5mJbXNp7lm2vH18</code>
                    <p class="note"><i class="fas fa-info-circle"></i> For full access, get your own key from Google Cloud Console</p>
                </div>
            </div>
        </div>
    `;

    document.getElementById('save-api-btn').addEventListener('click', saveApiKey);
    document.getElementById('api-key-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveApiKey();
    });

    // Auto-focus input
    setTimeout(() => {
        document.getElementById('api-key-input').focus();
    }, 100);
}

// Save API Key
function saveApiKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (key && key.length > 30) {
        localStorage.setItem('youtube_api_key', key);
        API_KEY = key;
        location.reload();
    } else {
        alert('Please enter a valid YouTube API key (should start with AIza and be about 40 characters)');
    }
}

// Show loading
function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

// Hide loading
function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// Format numbers
function formatNumber(num) {
    if (!num) return '0';
    num = parseInt(num);
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;

    const months = Math.floor(diffDays / 30);
    if (months === 1) return '1 month ago';
    if (months < 12) return `${months} months ago`;

    const years = Math.floor(months / 12);
    if (years === 1) return '1 year ago';
    return `${years} years ago`;
}

// Format duration
function formatDuration(duration) {
    if (!duration) return '0:00';
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    if (hours) {
        return `${hours.padStart(2, '0')}:${(minutes || '0').padStart(2, '0')}:${(seconds || '00').padStart(2, '0')}`;
    }
    return `${(minutes || '0').padStart(2, '0')}:${(seconds || '00').padStart(2, '0')}`;
}

// Load Videos
async function loadVideos() {
    if (isLoading || !API_KEY) return;

    isLoading = true;
    showLoading();

    try {
        let url = '';

        if (currentCategory === 'mostPopular') {
            url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=US&maxResults=12&key=${API_KEY}`;
        } else {
            const categoryMap = {
                music: 'music',
                gaming: 'gaming',
                news: 'news',
                sports: 'sports',
                learning: 'education'
            };
            const query = categoryMap[currentCategory] || currentCategory;
            url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=12&key=${API_KEY}`;
        }

        if (nextPageToken) {
            url += `&pageToken=${nextPageToken}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        nextPageToken = data.nextPageToken || '';

        if (currentCategory === 'mostPopular') {
            displayVideos(data.items);
        } else {
            const videoIds = data.items.map(item => item.id.videoId).join(',');
            const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`;
            const detailsResponse = await fetch(detailsUrl);
            const detailsData = await detailsResponse.json();
            displayVideos(detailsData.items);
        }

        isLoading = false;
        hideLoading();

    } catch (error) {
        console.error('Error loading videos:', error);
        showError('Failed to load videos. ' + error.message);
        isLoading = false;
        hideLoading();
    }
}

// Display Videos
function displayVideos(videos) {
    if (!videos || videos.length === 0) {
        videosContainer.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>No videos found</p></div>';
        return;
    }

    const videosHTML = videos.map(video => {
        const snippet = video.snippet;
        const stats = video.statistics || { viewCount: '0', likeCount: '0' };
        const contentDetails = video.contentDetails || { duration: 'PT0S' };
        const thumbnail = snippet.thumbnails?.medium?.url ||
                         snippet.thumbnails?.default?.url ||
                         `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`;

        return `
            <div class="video-card" data-video-id="${video.id}">
                <div class="thumbnail">
                    <img src="${thumbnail}"
                         alt="${snippet.title}"
                         loading="lazy"
                         onerror="this.onerror=null;this.src='https://via.placeholder.com/320x180/FF0000/FFFFFF?text=YouTube'">
                    <span class="duration">${formatDuration(contentDetails.duration)}</span>
                    <div class="play-overlay">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
                <div class="video-info">
                    <div class="video-info-inner">
                        <div class="channel-avatar-small">
                            ${snippet.channelTitle ? snippet.channelTitle.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div class="video-details-small">
                            <h3 class="video-title" title="${snippet.title}">${snippet.title}</h3>
                            <p class="channel-name">${snippet.channelTitle}</p>
                            <p class="video-stats-small">
                                <i class="fas fa-eye"></i> ${formatNumber(stats.viewCount)} •
                                <i class="far fa-clock"></i> ${formatDate(snippet.publishedAt)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    videosContainer.innerHTML = videosHTML;

    // Add click listeners
    document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => showVideoDetails(card.dataset.videoId));
    });
}

// Show Error
function showError(message) {
    videosContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
            <button onclick="location.reload()" class="retry-btn">
                <i class="fas fa-redo"></i> Retry
            </button>
            <button onclick="clearApiKey()" class="secondary-btn">
                <i class="fas fa-key"></i> Change API Key
            </button>
        </div>
    `;
}

// Perform Search
async function performSearch() {
    const query = searchInput.value.trim();
    if (!query || !API_KEY) return;

    try {
        videosContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Searching...</p></div>';

        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=20&key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error.message);
        }

        const videoIds = data.items.map(item => item.id.videoId).join(',');
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${API_KEY}`;
        const detailsResponse = await fetch(detailsUrl);
        const detailsData = await detailsResponse.json();

        displayVideos(detailsData.items);
        searchContainer.classList.add('hidden');
        searchInput.value = '';

    } catch (error) {
        console.error('Search error:', error);
        showError('Search failed. Please try again.');
    }
}

// Show Video Details with Player
async function showVideoDetails(videoId) {
    if (!API_KEY) return;

    try {
        showLoading();

        // First load video details
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!data.items || data.items.length === 0) {
            throw new Error('Video not found');
        }

        const video = data.items[0];
        const snippet = video.snippet;
        const stats = video.statistics || { viewCount: '0', likeCount: '0' };

        // Update modal content
        document.getElementById('video-title').textContent = snippet.title;
        document.getElementById('video-views').textContent = `${formatNumber(stats.viewCount)} views`;
        document.getElementById('video-date').textContent = formatDate(snippet.publishedAt);
        document.getElementById('video-likes').textContent = `${formatNumber(stats.likeCount)} likes`;
        document.getElementById('channel-title').textContent = snippet.channelTitle;

        // Format description with line breaks
        const description = snippet.description || 'No description available';
        document.getElementById('description-text').innerHTML = description
            .replace(/\n/g, '<br>')
            .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');

        // Get channel details
        try {
            const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${snippet.channelId}&key=${API_KEY}`;
            const channelResponse = await fetch(channelUrl);
            const channelData = await channelResponse.json();

            if (channelData.items && channelData.items[0]) {
                const channelStats = channelData.items[0].statistics;
                const channelSnippet = channelData.items[0].snippet;
                document.getElementById('subscriber-count').textContent =
                    `${formatNumber(channelStats.subscriberCount)} subscribers`;

                // Update channel avatar
                const channelAvatar = document.querySelector('.channel-avatar');
                if (channelSnippet.thumbnails?.default?.url) {
                    channelAvatar.innerHTML = `<img src="${channelSnippet.thumbnails.default.url}" alt="${snippet.channelTitle}">`;
                } else {
                    channelAvatar.textContent = snippet.channelTitle.charAt(0).toUpperCase();
                }
            }
        } catch (error) {
            console.error('Error loading channel info:', error);
            document.getElementById('subscriber-count').textContent = 'Subscribers not available';
        }

        // Create player
        createYouTubePlayerWithFallback(videoId);

        // Show modal
        videoModal.classList.remove('hidden');
        hideLoading();

    } catch (error) {
        console.error('Error loading video details:', error);
        alert('Failed to load video: ' + error.message);
        hideLoading();
    }
}

// Create player with fallback
function createYouTubePlayerWithFallback(videoId) {
    // Clear container
    videoPlayerContainer.innerHTML = '<div id="yt-player"></div>';

    // Try to create using YouTube API
    if (typeof YT !== 'undefined' && YT.Player) {
        try {
            createYouTubePlayer(videoId);

            // Set timeout to check if player loaded
            setTimeout(() => {
                const playerElement = document.getElementById('yt-player');
                if (!playerElement || playerElement.style.visibility === 'hidden') {
                    console.log('Player not visible, using fallback');
                    createDirectYouTubePlayer(videoId);
                }
            }, 1000);
        } catch (error) {
            console.error('Error creating YouTube API player:', error);
            createDirectYouTubePlayer(videoId);
        }
    } else {
        // Use direct iframe
        createDirectYouTubePlayer(videoId);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Search
    searchBtn.addEventListener('click', () => {
        searchContainer.classList.remove('hidden');
        searchInput.focus();
    });

    closeSearch.addEventListener('click', () => {
        searchContainer.classList.add('hidden');
        searchInput.value = '';
    });

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // Category tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = tab.dataset.category;
            videosContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading videos...</p></div>';
            nextPageToken = '';
            loadVideos();
        });
    });

    // Modal close
    closeModal.addEventListener('click', () => {
        videoModal.classList.add('hidden');
        // Pause video
        if (player) {
            if (player.pauseVideo && typeof player.pauseVideo === 'function') {
                player.pauseVideo();
            } else if (player.contentWindow && player.src) {
                // For iframe
                player.src = player.src.replace('autoplay=1', 'autoplay=0');
            }
        }
    });

    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Home button
            if (item.id === 'nav-home') {
                tabs.forEach(t => t.classList.remove('active'));
                tabs[0].classList.add('active');
                currentCategory = 'mostPopular';
                videosContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i><p>Loading videos...</p></div>';
                nextPageToken = '';
                loadVideos();
            }
        });
    });

    // Video action buttons
    document.getElementById('like-btn')?.addEventListener('click', () => {
        alert('👍 Like feature would work with user authentication');
    });

    document.getElementById('dislike-btn')?.addEventListener('click', () => {
        alert('👎 Dislike feature would work with user authentication');
    });

    document.getElementById('share-btn')?.addEventListener('click', () => {
        shareVideo();
    });

    document.getElementById('save-btn')?.addEventListener('click', () => {
        alert('💾 Save to playlist feature');
    });

    document.getElementById('subscribe-btn')?.addEventListener('click', () => {
        alert('🔔 Subscribe feature requires Google login');
    });

    // Player controls (if needed)
    document.addEventListener('keydown', (e) => {
        if (videoModal.classList.contains('hidden')) return;

        // Space key for play/pause
        if (e.code === 'Space') {
            e.preventDefault();
            if (player && player.getPlayerState) {
                const state = player.getPlayerState();
                if (state === YT.PlayerState.PLAYING) {
                    player.pauseVideo();
                } else {
                    player.playVideo();
                }
            }
        }

        // M key for mute/unmute
        if (e.code === 'KeyM') {
            e.preventDefault();
            if (player && player.isMuted && player.mute && player.unMute) {
                if (player.isMuted()) {
                    player.unMute();
                } else {
                    player.mute();
                }
            }
        }
    });

    // Infinite scroll
    window.addEventListener('scroll', handleScroll);
}

// Share video
function shareVideo() {
    if (!currentVideoId) return;

    const shareUrl = `https://youtu.be/${currentVideoId}`;
    const title = document.getElementById('video-title').textContent;

    if (navigator.share) {
        navigator.share({
            title: title,
            text: 'Check out this video on YouTube Clone',
            url: shareUrl
        });
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Video link copied to clipboard!');
        });
    } else {
        // Fallback
        prompt('Copy this link:', shareUrl);
    }
}

// Infinite Scroll
function handleScroll() {
    if (isLoading || !nextPageToken) return;

    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadVideos();
    }
}

// Clear API key
function clearApiKey() {
    if (confirm('Clear API key and reset app?')) {
        localStorage.removeItem('youtube_api_key');
        location.reload();
    }
}

// Export for debugging
window.clearApiKey = clearApiKey;