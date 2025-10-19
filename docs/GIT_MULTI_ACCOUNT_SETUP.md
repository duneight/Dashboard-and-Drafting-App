# Git Multi-Account Setup Guide

This guide explains how to work with multiple Git accounts across different projects in Cursor, allowing you to seamlessly switch between different GitHub accounts based on which project you're working on.

## Overview

When working on multiple projects that require different Git accounts (e.g., personal vs. work projects), you can configure Git to use different credentials per workspace rather than globally.

## Current Setup

### Dashboard and Drafting App
- **Repository**: `https://github.com/duneight/Dashboard-and-Drafting-App.git`
- **Git Config**:
  - Name: `Luke VanWyck`
  - Email: `lukevanwyck@gmail.com`
- **Account**: `duneight`

### Advantage Drafting App
- **Account**: `AdvantageDrafting`
- **Email**: `luke@advantagedrafting.com`

## How It Works

Git uses a hierarchy for configuration:
1. **Local config** (per-project) - Highest priority
2. **Global config** - Fallback when no local config exists

## Setup Commands

### For Dashboard and Drafting App (Current Project)
```bash
# Set local Git config for this project
git config user.name "Luke VanWyck"
git config user.email "lukevanwyck@gmail.com"

# Verify configuration
git config user.name
git config user.email
```

### For Advantage Drafting App (When Working on It)
```bash
# Navigate to your Advantage Drafting App folder
cd "path/to/your/advantage-drafting-app"

# Set local Git config for that project
git config user.name "AdvantageDrafting"
git config user.email "luke@advantagedrafting.com"

# Verify configuration
git config user.name
git config user.email
```

## Authentication Setup

### Method 1: Explicit Username in Remote URL (Recommended)
```bash
# Set remote with explicit username
git remote set-url origin https://username@github.com/username/repository.git

# Example for Dashboard app:
git remote set-url origin https://duneight@github.com/duneight/Dashboard-and-Drafting-App.git
```

### Method 2: Personal Access Token
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens
2. Generate new token with `repo` permissions
3. Use token as password when prompted:
   - Username: `your-github-username`
   - Password: `your-personal-access-token`

### Method 3: GitHub CLI (Optional)
```bash
# Install GitHub CLI
winget install --id GitHub.cli

# Authenticate
gh auth login
```

## Working with Multiple Projects in Cursor

### Switching Between Projects
1. **Open the project folder** you want to work on in Cursor
2. **Check Git config** to ensure correct account:
   ```bash
   git config user.name
   git config user.email
   ```
3. **Start working** - Git will automatically use the correct account

### Verification Commands
```bash
# Check current Git configuration
git config --list | findstr user

# Check remote URL
git remote -v

# Check current branch and status
git status
```

## Troubleshooting

### Wrong Account Being Used
```bash
# Clear cached credentials
git config --global --unset credential.helper
cmdkey /delete:LegacyGeneric:target=git:https://github.com

# Set explicit username in remote URL
git remote set-url origin https://correct-username@github.com/username/repo.git
```

### Permission Denied Errors
- Ensure you're using the correct GitHub account
- Check repository permissions
- Verify remote URL includes correct username
- Use Personal Access Token if password authentication fails

## Best Practices

1. **Always verify Git config** when switching projects
2. **Use explicit usernames** in remote URLs to avoid confusion
3. **Keep Personal Access Tokens** for each account
4. **Document account mappings** for each project
5. **Test push/pull** after switching projects

## Quick Reference

| Project | Account | Email | Repository |
|---------|---------|-------|------------|
| Dashboard and Drafting App | duneight | lukevanwyck@gmail.com | https://github.com/duneight/Dashboard-and-Drafting-App.git |
| Advantage Drafting App | AdvantageDrafting | luke@advantagedrafting.com | TBD |

## Commands Cheat Sheet

```bash
# Set local config for current project
git config user.name "Account Name"
git config user.email "account@email.com"

# Check current config
git config user.name
git config user.email

# Set remote with username
git remote set-url origin https://username@github.com/username/repo.git

# Push to remote
git push -u origin main

# Check remote
git remote -v
```

---

*Last updated: October 18, 2025*
*Created for Dashboard and Drafting App project*
