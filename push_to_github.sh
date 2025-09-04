#!/bin/bash

# Bash script to push Informatica to PySpark project to GitHub
# Usage: ./push_to_github.sh <github_username> [repository_name]

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default repository name
REPO_NAME="informatica-pyspark-converter"

# Check arguments
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ Error: GitHub username is required!${NC}"
    echo "Usage: $0 <github_username> [repository_name]"
    echo "Example: $0 myusername informatica-pyspark-converter"
    exit 1
fi

GITHUB_USERNAME=$1
if [ $# -eq 2 ]; then
    REPO_NAME=$2
fi

GITHUB_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

echo -e "${GREEN}🚀 Pushing Informatica to PySpark Workflow Converter to GitHub${NC}"
echo "============================================================"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not in a Git repository!${NC}"
    echo -e "${YELLOW}Please run this script from the project root directory.${NC}"
    exit 1
fi

echo -e "${CYAN}📋 Repository Details:${NC}"
echo "   Username: $GITHUB_USERNAME"
echo "   Repository: $REPO_NAME"
echo "   URL: $GITHUB_URL"
echo ""

# Check current git status
echo -e "${YELLOW}🔍 Checking current Git status...${NC}"
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Warning: You have uncommitted changes:${NC}"
    git status --short
    echo ""
    read -p "Do you want to commit them first? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}📝 Adding and committing changes...${NC}"
        git add .
        read -p "Enter commit message (or press Enter for default): " commit_msg
        if [ -z "$commit_msg" ]; then
            commit_msg="Update project files before GitHub push"
        fi
        git commit -m "$commit_msg"
    fi
fi

# Show current commits
echo -e "${CYAN}📜 Current commit history:${NC}"
git log --oneline -5

echo ""
echo -e "${YELLOW}🌐 Setting up GitHub remote...${NC}"

# Remove existing origin if it exists
if git remote get-url origin &> /dev/null; then
    existing_remote=$(git remote get-url origin)
    echo "   Removing existing remote: $existing_remote"
    git remote remove origin
fi

# Add GitHub remote
echo "   Adding GitHub remote: $GITHUB_URL"
git remote add origin $GITHUB_URL

# Verify remote was added
new_remote=$(git remote get-url origin)
echo -e "   ${GREEN}✅ Remote added: $new_remote${NC}"

echo ""
echo -e "${YELLOW}🔄 Preparing to push to GitHub...${NC}"

# Rename branch to main (GitHub default)
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "   Renaming branch '$current_branch' to 'main'..."
    git branch -M main
fi

echo ""
echo -e "${GREEN}🚀 Pushing to GitHub...${NC}"
echo "   This may take a moment for the first push..."

# Push to GitHub
if git push -u origin main; then
    echo ""
    echo -e "${GREEN}🎉 SUCCESS! Your project has been pushed to GitHub!${NC}"
    echo ""
    echo -e "${CYAN}📍 Your repository is now available at:${NC}"
    echo -e "${BLUE}   https://github.com/$GITHUB_USERNAME/$REPO_NAME${NC}"
    echo ""
    echo -e "${YELLOW}🔗 Next steps:${NC}"
    echo "   1. Visit your GitHub repository"
    echo "   2. Add a description and topics"
    echo "   3. Enable GitHub Pages (optional)"
    echo "   4. Set up branch protection rules"
    echo "   5. Invite collaborators if needed"
    echo ""
    echo -e "${CYAN}📊 Repository Statistics:${NC}"
    file_count=$(git ls-files | wc -l)
    commit_count=$(git rev-list --count HEAD)
    echo "   Files: $file_count"
    echo "   Commits: $commit_count"
    echo "   Branch: main"
else
    echo ""
    echo -e "${RED}❌ Error pushing to GitHub!${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Troubleshooting tips:${NC}"
    echo "   1. Make sure the repository exists on GitHub"
    echo "   2. Check your GitHub username is correct"
    echo "   3. Ensure you have write access to the repository"
    echo "   4. Try authenticating with GitHub CLI: gh auth login"
    echo "   5. Or use a personal access token"
    echo ""
    echo -e "${CYAN}🌐 GitHub repository should be created at:${NC}"
    echo "   https://github.com/new"
    exit 1
fi

echo "============================================================"
echo -e "${GREEN}✨ GitHub setup complete! Happy coding! ✨${NC}"
