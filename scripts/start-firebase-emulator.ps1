# PowerShell script to start Firebase Local Emulator

# Check if firebase-tools is installed
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Host "Firebase CLI is not installed. Installing..." -ForegroundColor Yellow
    npm install -g firebase-tools
}

# Start the emulator
Write-Host "Starting Firebase Local Emulator..." -ForegroundColor Green
firebase emulators:start --only firestore
