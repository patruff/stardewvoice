// Stardew Voice Bundle Tracker - Web App
// Using Web Speech API for voice recognition

class BundleTracker {
    constructor() {
        this.bundles = null;
        this.progress = this.loadProgress();
        this.recognition = null;
        this.isListening = false;
        this.currentSeason = 'spring';
        this.strictMode = true;

        this.init();
    }

    async init() {
        // Load bundle data
        await this.loadBundles();

        // Setup voice recognition
        this.setupVoiceRecognition();

        // Setup UI
        this.setupUI();

        // Setup PWA install
        this.setupPWA();
    }

    async loadBundles() {
        try {
            const response = await fetch('bundles.json');
            this.bundles = await response.json();
        } catch (error) {
            console.error('Failed to load bundles:', error);
            this.showError('Failed to load bundle data. Please refresh the page.');
        }
    }

    loadProgress() {
        const saved = localStorage.getItem('stardew_progress');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            collectedItems: {},
            completedBundles: []
        };
    }

    saveProgress() {
        localStorage.setItem('stardew_progress', JSON.stringify(this.progress));
    }

    setupVoiceRecognition() {
        // Check for Web Speech API support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            this.showError('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
            document.getElementById('voiceBtn').disabled = true;
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        this.recognition.lang = 'en-US';

        this.recognition.onstart = () => {
            this.isListening = true;
            this.updateStatus('Listening...', 'listening');
            document.getElementById('voiceBtn').classList.add('listening');
            document.querySelector('.btn-text').textContent = 'Listening...';
        };

        this.recognition.onend = () => {
            this.isListening = false;
            this.updateStatus('', '');
            document.getElementById('voiceBtn').classList.remove('listening');
            document.querySelector('.btn-text').textContent = 'Tap to Speak';
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.processCommand(transcript);
        };

        this.recognition.onerror = (event) => {
            let message = 'Voice recognition error';

            switch(event.error) {
                case 'no-speech':
                    message = 'No speech detected. Please try again.';
                    break;
                case 'network':
                    message = 'Network error. Check your connection.';
                    break;
                case 'not-allowed':
                    message = 'Microphone access denied. Please enable it in browser settings.';
                    break;
                case 'aborted':
                    return; // User stopped, don't show error
                default:
                    message = `Error: ${event.error}`;
            }

            this.showError(message);
        };
    }

    setupUI() {
        // Season selector buttons
        document.querySelectorAll('.season-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                e.target.classList.add('active');
                // Update current season
                this.currentSeason = e.target.dataset.season;
            });
        });

        // Strict mode toggle
        document.getElementById('strictMode').addEventListener('change', (e) => {
            this.strictMode = e.target.checked;
        });

        // Quick progress button (in settings bar)
        document.getElementById('quickProgressBtn').addEventListener('click', () => {
            this.showProgress();
        });

        // Voice button
        document.getElementById('voiceBtn').addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });

        // Progress button (bottom)
        document.getElementById('progressBtn').addEventListener('click', () => {
            this.showProgress();
        });

        // Reset button
        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetProgress();
        });
    }

    setupPWA() {
        // PWA install prompt
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('installPrompt').style.display = 'block';
        });

        document.getElementById('installBtn').addEventListener('click', async () => {
            if (!deferredPrompt) return;

            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;

            if (outcome === 'accepted') {
                document.getElementById('installPrompt').style.display = 'none';
            }

            deferredPrompt = null;
        });

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .catch(err => console.log('Service worker registration failed:', err));
        }
    }

    toggleVoiceRecognition() {
        if (!this.recognition) return;

        if (this.isListening) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Recognition start error:', error);
            }
        }
    }

    processCommand(command) {
        this.displayText(`You said: "${command}"\n\n`);

        const lowerCommand = command.toLowerCase();

        if (lowerCommand.includes('caught')) {
            this.handleCaughtItem(lowerCommand);
        } else if (lowerCommand.includes('need') || lowerCommand.includes('anything') || lowerCommand.includes('left')) {
            this.handleWhatNeeded(lowerCommand);
        } else if (lowerCommand.includes('progress')) {
            this.showProgress();
        } else if (lowerCommand.includes('reset') || lowerCommand.includes('start over')) {
            this.resetProgress();
        } else {
            this.showError(
                "Command not recognized. Try:\n" +
                "• 'Caught [item name]'\n" +
                "• 'What's left?' or 'What do I need?'\n" +
                "• 'Show progress'"
            );
        }
    }

    handleCaughtItem(command) {
        const itemName = this.extractItemName(command, 'caught');

        if (!itemName) {
            this.showError("Couldn't identify the item. Please say 'caught [item name]'");
            return;
        }

        const result = this.addItem(itemName);
        this.displayText(result);

        if (!result.startsWith('Item')) {
            this.updateStatus('Item added! ✓', 'success');
        }
    }

    handleWhatNeeded(command) {
        // Try to extract season from command, otherwise use selected season
        let season = this.extractSeason(command);

        if (!season) {
            season = this.currentSeason;
        }

        const result = this.getNeededItems(season);
        this.displayText(result);
    }

    extractItemName(command, keyword) {
        const parts = command.split(keyword);
        if (parts.length < 2) return null;

        let itemPart = parts[1].trim();

        // Remove common prefixes
        const prefixes = ['the ', 'a ', 'an '];
        for (const prefix of prefixes) {
            if (itemPart.startsWith(prefix)) {
                itemPart = itemPart.substring(prefix.length);
            }
        }

        // Remove punctuation
        itemPart = itemPart.replace(/[.!?]$/, '');

        return itemPart || null;
    }

    extractSeason(command) {
        const seasons = ['spring', 'summer', 'fall', 'winter'];

        for (const season of seasons) {
            if (command.includes(season)) {
                return season;
            }
        }

        // Check for day patterns like "spring 12"
        const dayPattern = /(spring|summer|fall|winter)\s+\d+/;
        const match = command.match(dayPattern);

        return match ? match[1] : null;
    }

    addItem(itemName) {
        const normalizedName = itemName.toLowerCase().trim();

        // Find which bundle this item belongs to
        for (const [categoryKey, category] of Object.entries(this.bundles.bundles)) {
            for (const [bundleKey, bundle] of Object.entries(category.bundles)) {
                const matchingItem = bundle.items.find(item =>
                    item.name.toLowerCase() === normalizedName
                );

                if (matchingItem) {
                    const bundleId = `${categoryKey}.${bundleKey}`;

                    // Check if already collected
                    if (this.progress.collectedItems[bundleId]?.includes(matchingItem.name)) {
                        return `You already collected ${matchingItem.name} for ${bundle.name}!`;
                    }

                    // Add to collected items
                    if (!this.progress.collectedItems[bundleId]) {
                        this.progress.collectedItems[bundleId] = [];
                    }
                    this.progress.collectedItems[bundleId].push(matchingItem.name);

                    // Check if bundle is complete
                    const collected = this.progress.collectedItems[bundleId].length;
                    let message;

                    if (collected >= bundle.required) {
                        this.progress.completedBundles.push(bundleId);
                        message = `Added ${matchingItem.name}! ${bundle.name} is now COMPLETE! 🎉`;
                    } else {
                        message = `Added ${matchingItem.name} to ${bundle.name}! (${collected}/${bundle.required})`;
                    }

                    this.saveProgress();
                    return message;
                }
            }
        }

        return `Item '${itemName}' not found in any bundle. Please check the name.`;
    }

    getNeededItems(season) {
        const normalizedSeason = season.toLowerCase();
        const seasonalItems = {};
        const outOfSeasonItems = {};

        // Collect all needed items
        for (const [categoryKey, category] of Object.entries(this.bundles.bundles)) {
            for (const [bundleKey, bundle] of Object.entries(category.bundles)) {
                const bundleId = `${categoryKey}.${bundleKey}`;

                // Skip completed bundles
                if (this.progress.completedBundles.includes(bundleId)) continue;

                const collectedInBundle = this.progress.collectedItems[bundleId] || [];
                const remaining = bundle.required - collectedInBundle.length;

                if (remaining > 0) {
                    for (const item of bundle.items) {
                        // Skip already collected items
                        if (collectedInBundle.includes(item.name)) continue;

                        const isInSeason = item.seasons.map(s => s.toLowerCase()).includes(normalizedSeason);
                        const itemData = { item, bundleName: bundle.name };

                        if (isInSeason) {
                            // Group by bundle name
                            if (!seasonalItems[bundle.name]) {
                                seasonalItems[bundle.name] = [];
                            }
                            seasonalItems[bundle.name].push(itemData);
                        } else if (!this.strictMode) {
                            // Out of season items
                            if (!outOfSeasonItems[bundle.name]) {
                                outOfSeasonItems[bundle.name] = [];
                            }
                            outOfSeasonItems[bundle.name].push(itemData);
                        }
                    }
                }
            }
        }

        // Build result string
        let result = `📋 Items for ${season.charAt(0).toUpperCase() + season.slice(1)}:\n\n`;

        // Show seasonal items grouped by bundle
        const seasonalBundles = Object.keys(seasonalItems).sort();

        if (seasonalBundles.length === 0) {
            result += `✅ Great! No items needed this season.\n`;
        } else {
            for (const bundleName of seasonalBundles) {
                result += `━━━ ${bundleName} ━━━\n`;

                // Sort by difficulty within bundle
                const items = seasonalItems[bundleName].sort((a, b) => a.item.difficulty - b.item.difficulty);

                for (const { item } of items) {
                    result += this.formatItem(item);
                }
                result += '\n';
            }
        }

        // Show out of season items if strict mode is off
        if (!this.strictMode && Object.keys(outOfSeasonItems).length > 0) {
            result += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
            result += `📅 Items Needed (Not This Season):\n\n`;

            const outOfSeasonBundles = Object.keys(outOfSeasonItems).sort();
            for (const bundleName of outOfSeasonBundles) {
                result += `${bundleName}:\n`;

                for (const { item } of outOfSeasonItems[bundleName]) {
                    const availableSeasons = item.seasons.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
                    result += `  • ${item.name}`;
                    if (item.quality === 'gold') result += ' (Gold)';
                    if (item.quantity > 1) result += ` x${item.quantity}`;
                    result += ` - Available: ${availableSeasons}\n`;
                }
            }
        }

        return result;
    }

    formatItem(item) {
        let line = `  • `;

        // Item name with quantity
        if (item.quantity > 1) {
            line += `${item.quantity}x `;
        }
        line += item.name;

        // Quality
        if (item.quality === 'gold') {
            line += ' ⭐ (Gold Quality)';
        }

        // Build restrictions
        const restrictions = [];

        // Location
        if (item.location) {
            const locationMap = {
                'ocean': 'Ocean',
                'freshwater': 'River/Lake',
                'mines': 'Mines',
                'desert': 'Desert',
                'secret_woods': 'Secret Woods'
            };
            restrictions.push(locationMap[item.location] || item.location.replace(/_/g, ' '));
        }

        // Time
        if (item.time) {
            const timeMap = {
                'night': '6pm-2am',
                'day': '6am-7pm'
            };
            restrictions.push(timeMap[item.time] || item.time);
        }

        // Weather
        if (item.weather) {
            restrictions.push(item.weather === 'rain' ? 'Rainy' : item.weather);
        }

        // Difficulty
        const difficultyStars = '⭐'.repeat(item.difficulty);
        restrictions.push(difficultyStars);

        if (restrictions.length > 0) {
            line += `\n      ${restrictions.join(' • ')}`;
        }

        line += '\n';
        return line;
    }

    showProgress() {
        let total = 0;
        let completed = 0;
        let result = `📊 Bundle Progress${this.strictMode ? ` - ${this.currentSeason.charAt(0).toUpperCase() + this.currentSeason.slice(1)}` : ''}:\n\n`;

        // First pass: collect bundle info
        const bundlesByCategory = {};

        for (const [categoryKey, category] of Object.entries(this.bundles.bundles)) {
            bundlesByCategory[categoryKey] = {
                name: category.name,
                bundles: []
            };

            for (const [bundleKey, bundle] of Object.entries(category.bundles)) {
                const bundleId = `${categoryKey}.${bundleKey}`;
                const collectedInBundle = this.progress.collectedItems[bundleId] || [];
                const collectedCount = collectedInBundle.length;
                const isComplete = this.progress.completedBundles.includes(bundleId);

                // Check if bundle has UNCOLLECTED items for current season
                const hasSeasonalItemsNeeded = bundle.items.some(item => {
                    // Skip already collected items
                    if (collectedInBundle.includes(item.name)) return false;
                    // Check if this uncollected item is available in current season
                    return item.seasons.map(s => s.toLowerCase()).includes(this.currentSeason.toLowerCase());
                });

                // Skip bundle if strict mode and no seasonal items needed (unless completed)
                if (this.strictMode && !hasSeasonalItemsNeeded && !isComplete) {
                    continue;
                }

                total++;
                if (isComplete) completed++;

                bundlesByCategory[categoryKey].bundles.push({
                    bundle,
                    bundleId,
                    collectedInBundle,
                    collectedCount,
                    isComplete,
                    hasSeasonalItemsNeeded
                });
            }
        }

        // Second pass: display bundles
        for (const [categoryKey, categoryData] of Object.entries(bundlesByCategory)) {
            // Skip empty categories
            if (categoryData.bundles.length === 0) continue;

            result += `━━━━━ ${categoryData.name} ━━━━━\n\n`;

            for (const bundleData of categoryData.bundles) {
                const { bundle, bundleId, collectedInBundle, collectedCount, isComplete } = bundleData;

                // Bundle header
                if (isComplete) {
                    result += `✅ ${bundle.name} - COMPLETE!\n\n`;
                } else {
                    result += `📦 ${bundle.name} (${collectedCount}/${bundle.required})\n`;

                    // Show collected items
                    if (collectedCount > 0) {
                        result += `  Collected:\n`;
                        for (const itemName of collectedInBundle) {
                            result += `    ✓ ${itemName}\n`;
                        }
                    }

                    // Show needed items (filtered by season if strict mode)
                    let neededItems = bundle.items.filter(item => !collectedInBundle.includes(item.name));

                    if (this.strictMode) {
                        // Only show items available in current season
                        neededItems = neededItems.filter(item =>
                            item.seasons.map(s => s.toLowerCase()).includes(this.currentSeason.toLowerCase())
                        );
                    }

                    const stillNeeded = bundle.required - collectedCount;

                    if (neededItems.length > 0) {
                        const seasonNote = this.strictMode ? ` (${this.currentSeason})` : '';
                        result += `  Still Needed (${stillNeeded} more${seasonNote}):\n`;
                        for (const item of neededItems) {
                            result += this.formatProgressItem(item);
                        }
                    } else if (stillNeeded > 0 && this.strictMode) {
                        // There are items needed but not available this season
                        result += `  ℹ️ ${stillNeeded} item(s) needed, but not available in ${this.currentSeason}\n`;
                    }

                    result += '\n';
                }
            }
        }

        if (total === 0 && this.strictMode) {
            result += `ℹ️ No bundles have items available in ${this.currentSeason}.\nTurn off Strict Mode to see all bundles.\n\n`;
        }

        result += `━━━━━━━━━━━━━━━━━━━━━━\n`;
        const totalBundles = Object.values(this.bundles.bundles).reduce((sum, cat) => sum + Object.keys(cat.bundles).length, 0);
        result += `Total Progress: ${completed}/${totalBundles} bundles complete (${Math.round(completed/totalBundles*100)}%)`;

        if (this.strictMode) {
            result += `\nShowing: ${total} ${this.currentSeason} bundles`;
        }

        this.displayText(result);
    }

    formatProgressItem(item) {
        let line = `    ○ `;

        // Item name with quantity
        if (item.quantity > 1) {
            line += `${item.quantity}x `;
        }
        line += item.name;

        // Quality
        if (item.quality === 'gold') {
            line += ' ⭐ (Gold)';
        }

        // Build info line
        const info = [];

        // Seasons
        const seasonIcons = {
            'spring': '🌱',
            'summer': '☀️',
            'fall': '🍂',
            'winter': '❄️'
        };
        const seasonStr = item.seasons.map(s => seasonIcons[s.toLowerCase()] || s).join('');
        info.push(seasonStr);

        // Location
        if (item.location) {
            const locationMap = {
                'ocean': '🌊 Ocean',
                'freshwater': '🏞️ River/Lake',
                'mines': '⛏️ Mines',
                'desert': '🏜️ Desert',
                'secret_woods': '🌲 Secret Woods'
            };
            info.push(locationMap[item.location] || item.location.replace(/_/g, ' '));
        }

        // Time
        if (item.time) {
            const timeMap = {
                'night': '🌙 6pm-2am',
                'day': '☀️ 6am-7pm'
            };
            info.push(timeMap[item.time] || item.time);
        }

        // Weather
        if (item.weather) {
            info.push(item.weather === 'rain' ? '🌧️ Rain' : item.weather);
        }

        // Difficulty
        const difficultyStars = '⭐'.repeat(item.difficulty);
        info.push(difficultyStars);

        if (info.length > 0) {
            line += `\n        ${info.join(' • ')}`;
        }

        line += '\n';
        return line;
    }

    resetProgress() {
        if (confirm('Are you sure you want to reset all your bundle progress?')) {
            this.progress = {
                collectedItems: {},
                completedBundles: []
            };
            this.saveProgress();
            this.displayText('All progress has been reset!');
            this.updateStatus('Progress reset', 'success');
        }
    }

    displayText(text) {
        const output = document.getElementById('output');
        output.innerHTML = `<pre class="output-text">${this.escapeHtml(text)}</pre>`;
        output.scrollTop = 0;
    }

    updateStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status-indicator ${type}`;
    }

    showError(message) {
        this.displayText(message);
        this.updateStatus('Error', 'error');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bundleTracker = new BundleTracker();
});
