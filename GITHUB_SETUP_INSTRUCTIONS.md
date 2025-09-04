# 🚀 GitHub Setup Instructions

## 📋 **Prerequisites**

Before running the script, you need to:

### 1. **Create GitHub Repository**
1. Go to [GitHub.com](https://github.com) and sign in
2. Click the **"+"** button in the top right corner
3. Select **"New repository"**
4. Repository settings:
   - **Repository name**: `informatica-pyspark-converter` (or your preferred name)
   - **Description**: "Convert Informatica PowerCenter workflows to PySpark with interactive dashboard"
   - **Visibility**: Choose Public or Private
   - **⚠️ IMPORTANT**: Do NOT initialize with README, .gitignore, or license (we already have these)
5. Click **"Create repository"**

### 2. **GitHub Authentication**
Choose one of these methods:

#### **Option A: GitHub CLI (Recommended)**
```bash
# Install GitHub CLI from https://cli.github.com/
gh auth login
```

#### **Option B: Personal Access Token**
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Use token as password when prompted

#### **Option C: Git Credential Manager**
- Windows users: Git Credential Manager should handle this automatically
- You'll be prompted to authenticate via browser

## 🖥️ **Running the Script**

### **For Windows (PowerShell)**

1. **Open PowerShell as Administrator** (recommended)
2. **Navigate to project directory:**
   ```powershell
   cd "D:\Sarath\Prevoria\InformaticatoPyspark"
   ```

3. **Run the script:**
   ```powershell
   .\push_to_github.ps1 -GitHubUsername "YOUR_GITHUB_USERNAME"
   ```

   **Example:**
   ```powershell
   .\push_to_github.ps1 -GitHubUsername "sarath-prevoria"
   ```

   **With custom repository name:**
   ```powershell
   .\push_to_github.ps1 -GitHubUsername "sarath-prevoria" -RepositoryName "my-etl-converter"
   ```

### **For Linux/Mac (Bash)**

1. **Open Terminal**
2. **Navigate to project directory:**
   ```bash
   cd /path/to/InformaticatoPyspark
   ```

3. **Make script executable:**
   ```bash
   chmod +x push_to_github.sh
   ```

4. **Run the script:**
   ```bash
   ./push_to_github.sh YOUR_GITHUB_USERNAME
   ```

   **Example:**
   ```bash
   ./push_to_github.sh sarath-prevoria
   ```

## 🔧 **Manual Setup (Alternative)**

If you prefer to run commands manually:

```bash
# 1. Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/informatica-pyspark-converter.git

# 2. Rename branch to main
git branch -M main

# 3. Push to GitHub
git push -u origin main
```

## ⚠️ **Troubleshooting**

### **PowerShell Execution Policy Error**
If you get an execution policy error:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **Authentication Failed**
1. **Check username**: Ensure your GitHub username is correct
2. **Repository exists**: Make sure you created the repository on GitHub
3. **Permissions**: Verify you have write access to the repository
4. **Two-factor authentication**: Use personal access token instead of password

### **Remote Already Exists**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/informatica-pyspark-converter.git
```

### **Branch Issues**
```bash
git branch -M main
git push -u origin main
```

## 📊 **What the Script Does**

1. ✅ **Validates environment**: Checks if you're in a Git repository
2. ✅ **Handles uncommitted changes**: Offers to commit any pending changes
3. ✅ **Sets up remote**: Adds GitHub as the origin remote
4. ✅ **Renames branch**: Changes master to main (GitHub standard)
5. ✅ **Pushes code**: Uploads all commits to GitHub
6. ✅ **Provides feedback**: Shows repository URL and next steps

## 🎯 **Expected Output**

```
🚀 Pushing Informatica to PySpark Workflow Converter to GitHub
============================================================
📋 Repository Details:
   Username: your-username
   Repository: informatica-pyspark-converter
   URL: https://github.com/your-username/informatica-pyspark-converter.git

🔍 Checking current Git status...
📜 Current commit history:
2b4dc16 Add Git setup guide for remote repository connection
b6e9fc4 Update .gitignore to exclude temporary files
8e10e83 Add comprehensive project summary
aafa4d1 Initial commit: Informatica to PySpark Workflow Converter

🌐 Setting up GitHub remote...
   ✅ Remote added: https://github.com/your-username/informatica-pyspark-converter.git

🚀 Pushing to GitHub...
   This may take a moment for the first push...

🎉 SUCCESS! Your project has been pushed to GitHub!

📍 Your repository is now available at:
   https://github.com/your-username/informatica-pyspark-converter

📊 Repository Statistics:
   Files: 22
   Commits: 4
   Branch: main
```

## 🎉 **After Successful Push**

Your repository will be available at:
**https://github.com/YOUR_USERNAME/informatica-pyspark-converter**

### **Recommended Next Steps:**
1. **Add repository description and topics**
2. **Enable GitHub Pages** (optional - for documentation)
3. **Set up branch protection rules**
4. **Add collaborators** if working in a team
5. **Create issues** for future enhancements
6. **Set up GitHub Actions** for CI/CD (optional)

## 🔗 **Repository Topics to Add**
Add these topics to make your repository discoverable:
- `informatica`
- `pyspark` 
- `etl`
- `data-engineering`
- `dashboard`
- `flask`
- `data-migration`
- `workflow-conversion`
- `analytics`
- `visualization`

---

**🌟 Your Informatica to PySpark Workflow Converter is now on GitHub! 🎉**
