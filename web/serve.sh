#!/bin/bash
# Simple HTTP server for local testing

echo "🌾 Starting Stardew Voice local server..."
echo ""
echo "📱 Open on your phone: http://[your-computer-ip]:8000"
echo "💻 Or locally: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Try different methods to start server
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m http.server 8000
elif command -v php &> /dev/null; then
    php -S localhost:8000
else
    echo "Error: No HTTP server available. Install Python or use 'npx serve'"
    exit 1
fi
