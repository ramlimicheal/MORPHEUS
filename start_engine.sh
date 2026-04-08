#!/bin/bash
echo "======================================================"
echo "          MORPHEUS ENGINE ACTIVATION SEQUENCE         "
echo "======================================================"
echo "Starting local Python server to bypass CORS limits..."
echo "This allows the engine to load the large Endel audio"
echo "banks directly into the Web Audio API."
echo "======================================================"

cd "$(dirname "$0")"

# Start the server in the background
python3 -m http.server 8888 2>/dev/null &
SERVER_PID=$!

# Wait exactly a moment for it to bind
sleep 1

echo "-> Engine online at http://localhost:8888/"
echo "-> Press CTRL+C to shutdown."
echo ""

# Open the browser to the exact right URL
open http://localhost:8888/

# Keep the script running
wait $SERVER_PID
