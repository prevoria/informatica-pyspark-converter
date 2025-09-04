# Interactive GitHub setup script
Write-Host "🚀 GitHub Repository Setup for Informatica to PySpark Converter" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# Get GitHub username
Write-Host ""
Write-Host "📋 Please provide your GitHub details:" -ForegroundColor Cyan
$username = Read-Host "Enter your GitHub username"

if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Host "❌ GitHub username is required!" -ForegroundColor Red
    exit 1
}

# Get repository name (optional)
Write-Host ""
$defaultRepo = "informatica-pyspark-converter"
$repoName = Read-Host "Enter repository name (press Enter for '$defaultRepo')"
if ([string]::IsNullOrWhiteSpace($repoName)) {
    $repoName = $defaultRepo
}

Write-Host ""
Write-Host "📊 Setup Summary:" -ForegroundColor Yellow
Write-Host "   GitHub Username: $username"
Write-Host "   Repository Name: $repoName"
Write-Host "   Repository URL: https://github.com/$username/$repoName"

Write-Host ""
$confirm = Read-Host "Proceed with GitHub setup? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ Setup cancelled by user." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "⚠️  IMPORTANT: Make sure you have created the repository on GitHub first!" -ForegroundColor Yellow
Write-Host "   1. Go to https://github.com/new"
Write-Host "   2. Repository name: $repoName"
Write-Host "   3. Do NOT initialize with README, .gitignore, or license"
Write-Host "   4. Click 'Create repository'"
Write-Host ""

$ready = Read-Host "Have you created the repository on GitHub? (y/n)"
if ($ready -ne 'y' -and $ready -ne 'Y') {
    Write-Host "❌ Please create the repository on GitHub first, then run this script again." -ForegroundColor Red
    Write-Host "🌐 Create repository at: https://github.com/new" -ForegroundColor Cyan
    exit 1
}

# Run the main setup script
Write-Host ""
Write-Host "🔄 Running GitHub setup..." -ForegroundColor Green
try {
    & .\push_to_github.ps1 -GitHubUsername $username -RepositoryName $repoName
} catch {
    Write-Host "❌ Error running setup script:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Manual setup commands:" -ForegroundColor Yellow
    Write-Host "git remote add origin https://github.com/$username/$repoName.git"
    Write-Host "git branch -M main"
    Write-Host "git push -u origin main"
}
