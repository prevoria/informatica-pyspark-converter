# Simple PowerShell script to push to GitHub
param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$RepositoryName = "informatica-pyspark-converter"
)

Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Green
Write-Host "Username: $GitHubUsername"
Write-Host "Repository: $RepositoryName"
Write-Host ""

# Construct GitHub URL
$GitHubUrl = "https://github.com/$GitHubUsername/$RepositoryName.git"

# Check git status
Write-Host "🔍 Checking Git status..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "🌐 Setting up GitHub remote..." -ForegroundColor Yellow

# Remove existing origin if it exists
git remote remove origin 2>$null

# Add GitHub remote
git remote add origin $GitHubUrl
Write-Host "✅ Added remote: $GitHubUrl" -ForegroundColor Green

# Rename branch to main
git branch -M main
Write-Host "✅ Renamed branch to main" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Green
Write-Host "⚠️  You may be prompted for GitHub authentication" -ForegroundColor Yellow

# Push to GitHub
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 SUCCESS! Repository pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Your repository:" -ForegroundColor Cyan
    Write-Host "   https://github.com/$GitHubUsername/$RepositoryName" -ForegroundColor Blue
    Write-Host ""
    Write-Host "🔗 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Visit your GitHub repository"
    Write-Host "   2. Add description and topics"
    Write-Host "   3. Set up branch protection (optional)"
} else {
    Write-Host ""
    Write-Host "❌ Error pushing to GitHub!" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Make sure:" -ForegroundColor Yellow
    Write-Host "   1. Repository exists on GitHub: https://github.com/new"
    Write-Host "   2. You have write access to the repository"
    Write-Host "   3. Your GitHub credentials are correct"
}
