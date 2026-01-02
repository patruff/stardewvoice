// Stardew Voice Bundle Tracker - Web App
// Using Web Speech API for voice recognition

class BundleTracker {
    constructor() {
        this.bundles = null;
        this.progress = this.loadProgress();
        this.recognition = null;
        this.isListening = false;

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
        // Voice button
        document.getElementById('voiceBtn').addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });

        // Progress button
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
        } else if (lowerCommand.includes('need') || lowerCommand.includes('anything')) {
            this.handleWhatNeeded(lowerCommand);
        } else if (lowerCommand.includes('progress')) {
            this.showProgress();
        } else if (lowerCommand.includes('reset') || lowerCommand.includes('start over')) {
            this.resetProgress();
        } else {
            this.showError(
                "Command not recognized. Try:\n" +
                "• 'Caught [item name]'\n" +
                "• 'What do I need for [season]?'\n" +
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
        const season = this.extractSeason(command);

        if (!season) {
            this.showError('Please specify a season (Spring, Summer, Fall, or Winter)');
            return;
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
        const neededItems = [];

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

                        // Check if available in current season
                        if (item.seasons.map(s => s.toLowerCase()).includes(normalizedSeason)) {
                            neededItems.push({ item, bundleName: bundle.name });
                        }
                    }
                }
            }
        }

        if (neededItems.length === 0) {
            return `Great job! You don't need anything else available in ${season}.`;
        }

        // Sort by difficulty
        neededItems.sort((a, b) => a.item.difficulty - b.item.difficulty);

        let result = `Items needed in ${season}:\n\n`;
        let currentDifficulty = -1;

        for (const { item, bundleName } of neededItems) {
            if (item.difficulty !== currentDifficulty) {
                currentDifficulty = item.difficulty;
                const difficultyLabel = ['⭐ Easy', '⭐⭐ Medium', '⭐⭐⭐ Hard', '⭐⭐⭐⭐ Very Hard'][currentDifficulty - 1];
                result += `\n${difficultyLabel}:\n`;
            }

            result += `• ${item.name}`;
            if (item.quality === 'gold') result += ' (Gold Quality)';
            if (item.quantity > 1) result += ` x${item.quantity}`;
            result += ` - ${bundleName}`;

            // Add helpful hints
            const hints = [];
            if (item.weather) hints.push(item.weather);
            if (item.time) hints.push(item.time);
            if (item.location) hints.push(item.location.replace(/_/g, ' '));
            if (hints.length > 0) {
                result += ` (${hints.join(', ')})`;
            }
            result += '\n';
        }

        return result;
    }

    showProgress() {
        let total = 0;
        let completed = 0;
        let result = 'Bundle Progress:\n\n';

        for (const [categoryKey, category] of Object.entries(this.bundles.bundles)) {
            result += `${category.name}:\n`;

            for (const [bundleKey, bundle] of Object.entries(category.bundles)) {
                total++;
                const bundleId = `${categoryKey}.${bundleKey}`;
                const collectedCount = this.progress.collectedItems[bundleId]?.length || 0;
                const isComplete = this.progress.completedBundles.includes(bundleId);

                if (isComplete) {
                    completed++;
                    result += `  ✓ ${bundle.name} - COMPLETE\n`;
                } else {
                    result += `  ○ ${bundle.name} - ${collectedCount}/${bundle.required}\n`;
                }
            }
            result += '\n';
        }

        result += `Total: ${completed}/${total} bundles complete`;
        this.displayText(result);
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
