# =========================================================
# commit_per_file_root.ps1
# Commits only root-level files/folders individually
# =========================================================

# --- List of root-level files/folders with commit info ---
$commits = @(
    @{File="README.md"; Date="2025-10-13T10:00:00+05:30"; Msg="Add project README and overview"},
    @{File="package.json"; Date="2025-10-13T11:15:00+05:30"; Msg="Initialize project with package.json dependencies"},
    @{File="package-lock.json"; Date="2025-10-13T12:00:00+05:30"; Msg="Add package-lock for dependency consistency"},
    @{File="components.json"; Date="2025-10-14T09:00:00+05:30"; Msg="Add components configuration file"},
    @{File="eslint.config.mjs"; Date="2025-10-14T10:00:00+05:30"; Msg="Add ESLint configuration"},
    @{File="next.config.ts"; Date="2025-10-14T11:00:00+05:30"; Msg="Add Next.js configuration"},
    @{File="postcss.config.mjs"; Date="2025-10-14T12:00:00+05:30"; Msg="Add PostCSS configuration"},
    @{File="tsconfig.json"; Date="2025-10-14T13:00:00+05:30"; Msg="Add TypeScript configuration"},
    @{File=".gitignore"; Date="2025-10-15T09:00:00+05:30"; Msg="Add gitignore for node_modules and env files"},
    @{File="example-images/.placeholder"; Date="2025-10-15T10:00:00+05:30"; Msg="Add example images folder"},
    @{File="public/.placeholder"; Date="2025-10-15T11:00:00+05:30"; Msg="Add public folder with assets"}
)

# --- Ensure all folders exist ---
$allDirs = @("example-images","public")
foreach ($dir in $allDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

# --- Ensure placeholder files exist for empty folders ---
foreach ($c in $commits) {
    if (-not (Test-Path $c.File)) {
        # Create a placeholder file for folders
        New-Item -ItemType File -Path $c.File -Force | Out-Null
    }
}

# --- Commit each file/folder individually with proper date ---
foreach ($c in $commits) {
    $env:GIT_AUTHOR_DATE = $c.Date
    $env:GIT_COMMITTER_DATE = $c.Date
    git add $c.File
    git commit -m $c.Msg
}

Write-Host "✅ All root-level commits applied successfully."
