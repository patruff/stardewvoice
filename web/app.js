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
        this.displayHTML(result);
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
                        const itemData = { item, bundleName: bundle.name, bundleId };

                        if (isInSeason) {
                            // Group by bundle name
                            if (!seasonalItems[bundle.name]) {
                                seasonalItems[bundle.name] = {
                                    items: [],
                                    bundleId,
                                    required: bundle.required,
                                    collected: collectedInBundle.length
                                };
                            }
                            seasonalItems[bundle.name].items.push(itemData);
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

        // Build HTML result
        let html = `<div class="bundle-list">`;
        html += `<h2 class="season-title">📋 Items for ${season.charAt(0).toUpperCase() + season.slice(1)}</h2>`;

        // Show seasonal items grouped by bundle
        const seasonalBundles = Object.keys(seasonalItems).sort();

        if (seasonalBundles.length === 0) {
            html += `<div class="empty-message">✅ Great! No items needed this season.</div>`;
        } else {
            for (const bundleName of seasonalBundles) {
                const bundleData = seasonalItems[bundleName];
                const progressPercent = (bundleData.collected / bundleData.required) * 100;

                // Sort items by priority first, then difficulty (Critical > High > Medium > Low)
                const items = bundleData.items.sort((a, b) => {
                    const priorityA = a.item.priority || 1;
                    const priorityB = b.item.priority || 1;
                    if (priorityA !== priorityB) {
                        return priorityB - priorityA; // Higher priority first
                    }
                    return b.item.difficulty - a.item.difficulty; // Then by difficulty
                });

                html += `<div class="bundle-card">`;
                html += `<div class="bundle-header">`;
                html += `<span>${bundleName}</span>`;
                html += `<span class="bundle-progress">${bundleData.collected}/${bundleData.required}</span>`;
                html += `</div>`;
                html += `<div class="progress-bar">`;
                html += `<div class="progress-fill" style="width: ${progressPercent}%"></div>`;
                html += `</div>`;
                html += `<div class="bundle-items">`;

                for (const { item, bundleId } of items) {
                    html += this.formatItemHTML(item, bundleId);
                }

                html += `</div></div>`;
            }
        }

        // Show out of season items if strict mode is off
        if (!this.strictMode && Object.keys(outOfSeasonItems).length > 0) {
            html += `<div class="out-of-season-section">`;
            html += `<h3>📅 Items Needed (Not This Season)</h3>`;

            const outOfSeasonBundles = Object.keys(outOfSeasonItems).sort();
            for (const bundleName of outOfSeasonBundles) {
                html += `<div class="out-of-season-bundle">`;
                html += `<h4>${bundleName}</h4>`;
                html += `<ul>`;

                for (const { item } of outOfSeasonItems[bundleName]) {
                    const availableSeasons = item.seasons.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
                    html += `<li>`;
                    html += `${item.name}`;
                    if (item.quality === 'gold') html += ' (Gold)';
                    if (item.quantity > 1) html += ` x${item.quantity}`;
                    html += ` - Available: ${availableSeasons}`;
                    html += `</li>`;
                }

                html += `</ul></div>`;
            }

            html += `</div>`;
        }

        html += `</div>`;
        return html;
    }

    formatItemHTML(item, bundleId) {
        const difficultyClass = this.getDifficultyClass(item.difficulty);
        const difficultyLabel = this.getDifficultyLabel(item.difficulty);
        const priority = item.priority || 1;
        const priorityClass = this.getPriorityClass(priority);
        const itemId = `${bundleId}-${item.name.replace(/\s/g, '-')}`;
        const hasQuantity = item.quantity && item.quantity > 1;

        // Get current collected count for this item
        const collectedInBundle = this.progress.collectedItems[bundleId] || [];
        const currentCount = collectedInBundle.filter(name => name === item.name).length;
        const isComplete = hasQuantity ? (currentCount >= item.quantity) : collectedInBundle.includes(item.name);

        let html = `<div class="item-row ${priorityClass}" data-bundle-id="${bundleId}" data-item-name="${this.escapeHtml(item.name)}">`;
        html += `<div class="item-main" onclick="toggleStrategy('${itemId}')">`;

        // Priority icon for high-priority items
        if (priority >= 4) {
            html += `<span class="priority-icon">⚠️</span>`;
        }

        if (hasQuantity) {
            // Quantity counter widget
            html += `<div class="item-info">`;
            html += `<span class="item-name">`;
            html += this.escapeHtml(item.name);
            if (item.quality === 'gold') html += ' ⭐ Gold';
            html += `</span>`;
            html += `<span class="difficulty-badge ${difficultyClass}">${difficultyLabel}</span>`;
            html += `</div>`;

            html += `<div class="counter-widget ${isComplete ? 'complete' : ''}" onclick="event.stopPropagation()">`;
            html += `<button class="counter-btn" onclick="decrementItem('${bundleId}', '${this.escapeHtml(item.name)}')">−</button>`;
            html += `<span class="counter-display">${currentCount} / ${item.quantity}</span>`;
            html += `<button class="counter-btn" onclick="incrementItem('${bundleId}', '${this.escapeHtml(item.name)}', ${item.quantity})">+</button>`;
            html += `</div>`;
        } else {
            // Simple checkbox for single items
            html += `<label class="item-checkbox" onclick="event.stopPropagation()">`;
            html += `<input type="checkbox" ${isComplete ? 'checked' : ''} data-item="${this.escapeHtml(item.name)}" data-bundle="${bundleId}">`;
            html += `<span class="item-name">`;
            html += this.escapeHtml(item.name);
            if (item.quality === 'gold') html += ' ⭐ Gold';
            html += `</span>`;
            html += `<span class="difficulty-badge ${difficultyClass}">${difficultyLabel}</span>`;
            html += `</label>`;
        }

        // Item subtitle (quick info)
        html += `<div class="item-subtitle">`;
        const subtitle = this.buildSubtitle(item);
        html += subtitle;
        html += `</div>`;

        html += `</div>`; // item-main

        // Strategy accordion (hidden by default)
        if (item.strategy) {
            html += `<div id="${itemId}" class="strategy-content hidden">`;
            html += `<p><strong>Strategy:</strong> ${this.escapeHtml(item.strategy)}</p>`;
            html += `</div>`;
        }

        html += `</div>`; // item-row

        return html;
    }

    getPriorityClass(priority) {
        if (priority === 4) return 'priority-critical';
        if (priority === 3) return 'priority-high';
        if (priority === 2) return 'priority-medium';
        return 'priority-low';
    }

    buildSubtitle(item) {
        const parts = [];

        // Location
        if (item.location) {
            const locationMap = {
                'ocean': 'Ocean',
                'freshwater': 'River/Lake',
                'mines': 'Mines',
                'desert': 'Desert',
                'secret_woods': 'Secret Woods'
            };
            parts.push(locationMap[item.location] || item.location.replace(/_/g, ' '));
        }

        // Time
        if (item.time) {
            const timeMap = {
                'night': '6pm-2am',
                'day': '6am-7pm',
                'evening': '4pm-2am',
                'noon': '12pm-4pm'
            };
            parts.push(timeMap[item.time] || item.time);
        }

        // Weather
        if (item.weather) {
            const weatherMap = {
                'rain': 'Rain',
                'sunny': 'Sunny'
            };
            parts.push(weatherMap[item.weather] || item.weather);
        }

        return parts.join(' • ');
    }

    getDifficultyClass(difficulty) {
        if (difficulty === 1) return 'difficulty-easy';
        if (difficulty === 2) return 'difficulty-medium';
        if (difficulty === 3) return 'difficulty-hard';
        if (difficulty === 4) return 'difficulty-killer';
        return 'difficulty-medium';
    }

    getDifficultyLabel(difficulty) {
        if (difficulty === 1) return '🟢 Easy';
        if (difficulty === 2) return '🟡 Medium';
        if (difficulty === 3) return '🔴 Hard';
        if (difficulty === 4) return '☠️ Run Killer';
        return 'Medium';
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
                'day': '6am-7pm',
                'evening': '4pm-2am',
                'noon': '12pm-4pm'
            };
            restrictions.push(timeMap[item.time] || item.time);
        }

        // Weather
        if (item.weather) {
            const weatherMap = {
                'rain': 'Rainy',
                'sunny': 'Sunny'
            };
            restrictions.push(weatherMap[item.weather] || item.weather);
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
                // In strict mode, also exclude year-round items (available all 4 seasons)
                const hasSeasonalItemsNeeded = bundle.items.some(item => {
                    // Skip already collected items
                    if (collectedInBundle.includes(item.name)) return false;

                    // Check if item is available in current season
                    const availableNow = item.seasons.map(s => s.toLowerCase()).includes(this.currentSeason.toLowerCase());
                    if (!availableNow) return false;

                    // In strict mode, exclude year-round items (available all 4 seasons)
                    if (this.strictMode) {
                        const isYearRound = item.seasons.length === 4;
                        return !isYearRound;
                    }

                    return true;
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
                    result += `✅ ${bundle.name} - COMPLETE!\n`;
                    // Show what was collected in completed bundle
                    if (collectedInBundle.length > 0) {
                        result += `  Collected:\n`;
                        for (const itemName of collectedInBundle) {
                            result += `    ✓ ${itemName}\n`;
                        }
                    }
                    result += '\n';
                } else {
                    // Calculate seasonal progress if in strict mode
                    if (this.strictMode) {
                        const seasonalItems = bundle.items.filter(item =>
                            item.seasons.map(s => s.toLowerCase()).includes(this.currentSeason.toLowerCase())
                        );
                        const collectedSeasonalItems = seasonalItems.filter(item =>
                            collectedInBundle.includes(item.name)
                        );

                        result += `📦 ${bundle.name}\n`;
                        result += `    ${this.currentSeason}: ${collectedSeasonalItems.length}/${seasonalItems.length} items | Overall: ${collectedCount}/${bundle.required}\n`;
                    } else {
                        result += `📦 ${bundle.name} (${collectedCount}/${bundle.required})\n`;
                    }

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
            line += ' (Gold)';
        }

        // Build concise info on same line
        const info = [];

        // Location
        if (item.location) {
            const locationMap = {
                'ocean': 'Ocean',
                'freshwater': 'River/Lake',
                'mines': 'Mines',
                'desert': 'Desert',
                'secret_woods': 'Secret Woods'
            };
            info.push(locationMap[item.location] || item.location.replace(/_/g, ' '));
        }

        // Time
        if (item.time) {
            const timeMap = {
                'night': '6pm-2am',
                'day': '6am-7pm',
                'evening': '4pm-2am',
                'noon': '12pm-4pm'
            };
            info.push(timeMap[item.time] || item.time);
        }

        // Weather
        if (item.weather) {
            const weatherMap = {
                'rain': 'Rain',
                'sunny': 'Sunny'
            };
            info.push(weatherMap[item.weather] || item.weather);
        }

        // Difficulty
        const difficultyStars = '⭐'.repeat(item.difficulty);
        info.push(difficultyStars);

        if (info.length > 0) {
            line += ` - ${info.join(', ')}`;
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

    displayHTML(html) {
        const output = document.getElementById('output');
        output.innerHTML = html;
        output.scrollTop = 0;

        // Add checkbox event listeners for single items
        const checkboxes = output.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const itemName = e.target.dataset.item;
                const bundleId = e.target.dataset.bundle;

                if (e.target.checked) {
                    // Add item
                    const result = this.addItem(itemName);
                    this.updateStatus(result, 'success');
                } else {
                    // Remove item
                    this.removeItem(itemName, bundleId);
                }

                // Re-render to update progress
                setTimeout(() => {
                    this.handleWhatNeeded();
                }, 500);
            });
        });
    }

    removeItem(itemName, bundleId) {
        if (!this.progress.collectedItems[bundleId]) return;

        const index = this.progress.collectedItems[bundleId].indexOf(itemName);
        if (index > -1) {
            this.progress.collectedItems[bundleId].splice(index, 1);
            this.saveProgress();
        }
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

// Global helper functions for UI interactions
function toggleStrategy(itemId) {
    const strategyDiv = document.getElementById(itemId);
    if (strategyDiv) {
        strategyDiv.classList.toggle('hidden');
    }
}

function incrementItem(bundleId, itemName, maxQuantity) {
    const tracker = window.bundleTracker;
    if (!tracker) return;

    const collectedInBundle = tracker.progress.collectedItems[bundleId] || [];
    const currentCount = collectedInBundle.filter(name => name === itemName).length;

    if (currentCount < maxQuantity) {
        // Add one more
        const result = tracker.addItem(itemName);
        tracker.updateStatus(`Added ${itemName}! (${currentCount + 1}/${maxQuantity})`, 'success');

        // Re-render to update counters
        setTimeout(() => {
            tracker.handleWhatNeeded();
        }, 300);
    }
}

function decrementItem(bundleId, itemName) {
    const tracker = window.bundleTracker;
    if (!tracker) return;

    const collectedInBundle = tracker.progress.collectedItems[bundleId] || [];
    const currentCount = collectedInBundle.filter(name => name === itemName).length;

    if (currentCount > 0) {
        // Remove one
        tracker.removeItem(itemName, bundleId);
        tracker.updateStatus(`Removed ${itemName}! (${currentCount - 1})`, 'success');

        // Re-render to update counters
        setTimeout(() => {
            tracker.handleWhatNeeded();
        }, 300);
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.bundleTracker = new BundleTracker();
});
