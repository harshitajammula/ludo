# Ludo Game - Quick Setup Script for Windows
# This script helps you install dependencies and set up the environment

Write-Host "🎲 Ludo Game - Setup Script" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "Checking for Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is installed
Write-Host "Checking for npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    exit 1
}

# Navigate to backend directory
Write-Host "`nNavigating to backend directory..." -ForegroundColor Yellow
Set-Location -Path "backend"

# Install dependencies
Write-Host "`nInstalling backend dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes...`n" -ForegroundColor Gray
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Check if .env file exists
Write-Host "`nChecking for .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file found" -ForegroundColor Green
} else {
    Write-Host "! .env file not found" -ForegroundColor Yellow
    Write-Host "Creating .env from template..." -ForegroundColor Yellow
    
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✓ .env file created from template" -ForegroundColor Green
        Write-Host "`n⚠️  IMPORTANT: Please edit the .env file and add your Google OAuth credentials" -ForegroundColor Yellow
        Write-Host "   See OAUTH_SETUP.md for detailed instructions`n" -ForegroundColor Yellow
    } else {
        Write-Host "✗ .env.example not found" -ForegroundColor Red
    }
}

# Return to root directory
Set-Location -Path ".."

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Configure Google OAuth (see OAUTH_SETUP.md)" -ForegroundColor White
Write-Host "2. Edit backend/.env with your credentials" -ForegroundColor White
Write-Host "3. Run: cd backend && npm start" -ForegroundColor White
Write-Host "4. Open http://localhost:3000 in your browser`n" -ForegroundColor White

Write-Host "For detailed setup instructions, see:" -ForegroundColor Cyan
Write-Host "- OAUTH_SETUP.md (Google OAuth setup)" -ForegroundColor White
Write-Host "- README.md (General documentation)`n" -ForegroundColor White

Write-Host "Happy gaming! 🎲`n" -ForegroundColor Green
