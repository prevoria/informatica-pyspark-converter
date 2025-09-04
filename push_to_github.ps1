# PowerShell script to push Informatica to PySpark project to GitHub
# Run this script after creating a new repository on GitHub

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,
    
    [Parameter(Mandatory=$false)]
    [string]$RepositoryName = "informatica-pyspark-converter"
)

Write-Host "🚀 Pushing Informatica to PySpark Workflow Converter to GitHub" -ForegroundColor Green
Write-Host "=" * 60

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a Git repository!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

# Construct GitHub URL
$GitHubUrl = "https://github.com/$GitHubUsername/$RepositoryName.git"

Write-Host "📋 Repository Details:" -ForegroundColor Cyan
Write-Host "   Username: $GitHubUsername"
Write-Host "   Repository: $RepositoryName"
Write-Host "   URL: $GitHubUrl"
Write-Host ""

# Check current git status
Write-Host "🔍 Checking current Git status..." -ForegroundColor Yellow
git status --porcelain

# Check if there are any uncommitted changes
$uncommittedChanges = git status --porcelain
if ($uncommittedChanges) {
    Write-Host "⚠️  Warning: You have uncommitted changes:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $continue = Read-Host "Do you want to commit them first? (y/n)"
    if ($continue -eq 'y' -or $continue -eq 'Y') {
        Write-Host "📝 Adding and committing changes..." -ForegroundColor Yellow
        git add .
        $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "Update project files before GitHub push"
        }
        git commit -m $commitMessage
    }
}

# Show current commits
Write-Host "📜 Current commit history:" -ForegroundColor Cyan
git log --oneline -5

Write-Host ""
Write-Host "🌐 Setting up GitHub remote..." -ForegroundColor Yellow

# Remove existing origin if it exists
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "   Removing existing remote: $existingRemote" -ForegroundColor Gray
    git remote remove origin
}

# Add GitHub remote
Write-Host "   Adding GitHub remote: $GitHubUrl" -ForegroundColor Gray
git remote add origin $GitHubUrl

# Verify remote was added
$newRemote = git remote get-url origin
Write-Host "   ✅ Remote added: $newRemote" -ForegroundColor Green

Write-Host ""
Write-Host "🔄 Preparing to push to GitHub..." -ForegroundColor Yellow

# Rename branch to main (GitHub default)
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    Write-Host "   Renaming branch '$currentBranch' to 'main'..." -ForegroundColor Gray
    git branch -M main
}

Write-Host ""
Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Green
Write-Host "   This may take a moment for the first push..." -ForegroundColor Gray

# Push to GitHub
try {
    git push -u origin main
    Write-Host ""
    Write-Host "🎉 SUCCESS! Your project has been pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 Your repository is now available at:" -ForegroundColor Cyan
    Write-Host "   https://github.com/$GitHubUsername/$RepositoryName" -ForegroundColor Blue
    Write-Host ""
    Write-Host "🔗 Next steps:" -ForegroundColor Yellow
    Write-Host "   1. Visit your GitHub repository"
    Write-Host "   2. Add a description and topics"
    Write-Host "   3. Enable GitHub Pages (optional)"
    Write-Host "   4. Set up branch protection rules"
    Write-Host "   5. Invite collaborators if needed"
    Write-Host ""
    Write-Host "📊 Repository Statistics:" -ForegroundColor Cyan
    $fileCount = (git ls-files | Measure-Object).Count
    $commitCount = (git rev-list --count HEAD)
    Write-Host "   Files: $fileCount"
    Write-Host "   Commits: $commitCount"
    Write-Host "   Branch: main"
    
} catch {
    Write-Host ""
    Write-Host "❌ Error pushing to GitHub:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "   1. Make sure the repository exists on GitHub"
    Write-Host "   2. Check your GitHub username is correct"
    Write-Host "   3. Ensure you have write access to the repository"
    Write-Host "   4. Try authenticating with GitHub CLI: gh auth login"
    Write-Host "   5. Or use a personal access token"
    Write-Host ""
    Write-Host "🌐 GitHub repository should be created at:" -ForegroundColor Cyan
    Write-Host "   https://github.com/new"
    exit 1
}

Write-Host "=" * 60
Write-Host "✨ GitHub setup complete! Happy coding! ✨" -ForegroundColor Green
