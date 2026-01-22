#!/bin/bash
# Script to start Firebase Local Emulator

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI is not installed. Installing..."
    npm install -g firebase-tools
fi

# Start the emulator
echo "Starting Firebase Local Emulator..."
firebase emulators:start --only firestore
