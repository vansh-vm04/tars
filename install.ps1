# TARS Standalone Installer — Windows PowerShell
# Installs the latest TARS binary with embedded Bun runtime
# Usage: irm https://raw.githubusercontent.com/vansh-vm04/tars/main/install.ps1 | iex
# Safe to re-run to update.

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$Repo = "vansh-vm04/tars"
$BinaryName = "tars-windows-x64.exe"
$TargetName = "tars.exe"
$InstallDir = Join-Path $env:LOCALAPPDATA "tars"
if (-not $InstallDir -or $InstallDir -eq "") {
    $InstallDir = Join-Path $HOME ".local\bin"
}
# Fallback if LOCALAPPDATA is not set (e.g., some minimal env)
if (-not (Test-Path $InstallDir -IsValid)) {
    try { New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null } catch {}
}

function Write-Info($msg)  { Write-Host "info: $msg" -ForegroundColor Green }
function Write-Warn($msg)  { Write-Host "warn: $msg" -ForegroundColor Yellow }
function Write-Err($msg)   { Write-Host "error: $msg" -ForegroundColor Red }

# 1. Detect architecture
$Arch = $env:PROCESSOR_ARCHITECTURE
# On 64-bit Windows, PROCESSOR_ARCHITECTURE is AMD64 even for x86 PowerShell
# Also check PROCESSOR_ARCHITEW6432
if ($env:PROCESSOR_ARCHITEW6432) { $Arch = $env:PROCESSOR_ARCHITEW6432 }

switch ($Arch.ToLower()) {
    { $_ -in "amd64", "x64", "x86_64" } { $DetectedArch = "x64" }
    { $_ -in "arm64", "aarch64" } {
        Write-Warn "ARM64 Windows detected ($Arch). TARS currently only provides windows-x64 binary."
        Write-Warn "Attempting to use x64 binary via emulation..."
        $DetectedArch = "x64"
    }
    default {
        Write-Err "Unsupported architecture: $Arch. TARS supports Windows x64."
        exit 1
    }
}

Write-Info "Detected Windows $DetectedArch -> $BinaryName"

# 2. Check for required commands (TLS 1.2 is default on modern PS)
try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 } catch {}

# 3. Find latest release
Write-Info "Finding latest TARS release (https://github.com/$Repo)..."
$ApiUrl = "https://api.github.com/repos/$Repo/releases/latest"

$LatestTag = $null
$DownloadUrl = $null
$ChecksumsUrl = $null

try {
    # Use Invoke-RestMethod if available, fallback to Invoke-WebRequest
    $Release = $null
    try {
        $Release = Invoke-RestMethod -Uri $ApiUrl -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    } catch {
        # Try with curl/wget fallback? On Windows, Invoke-RestMethod should exist
        throw
    }
    $LatestTag = $Release.tag_name
    if (-not $LatestTag) { throw "No tag_name in response" }

    # Find the asset URL for our binary (in case release has many assets)
    $Asset = $Release.assets | Where-Object { $_.name -eq $BinaryName } | Select-Object -First 1
    if ($Asset -and $Asset.browser_download_url) {
        $DownloadUrl = $Asset.browser_download_url
    } else {
        # Fallback to conventional URL
        $DownloadUrl = "https://github.com/$Repo/releases/download/$LatestTag/$BinaryName"
    }
    $ChecksumsUrl = "https://github.com/$Repo/releases/download/$LatestTag/checksums.txt"
} catch {
    Write-Err "Failed to fetch latest release info from $ApiUrl"
    Write-Err $_.Exception.Message
    Write-Host "Check your internet connection and that https://github.com/$Repo exists." -ForegroundColor Yellow
    exit 1
}

Write-Info "Latest release: $LatestTag"
Write-Info "Download URL: $DownloadUrl"

# 4. Prepare install dir
try {
    New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
} catch {
    Write-Err "Failed to create install directory: $InstallDir"
    Write-Err $_.Exception.Message
    exit 1
}

$TmpFile = Join-Path $env:TEMP "tars-$([Guid]::NewGuid().ToString()).exe"
$TmpChecksums = Join-Path $env:TEMP "tars-checksums-$([Guid]::NewGuid().ToString()).txt"

# Cleanup on exit
$Cleanup = {
    if (Test-Path $TmpFile) { Remove-Item $TmpFile -Force -ErrorAction SilentlyContinue }
    if (Test-Path $TmpChecksums) { Remove-Item $TmpChecksums -Force -ErrorAction SilentlyContinue }
}
# Use try/finally for cleanup, but also register

# 5. Download
Write-Info "Downloading $BinaryName..."
try {
    # Use Invoke-WebRequest with progress suppressed (faster)
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $TmpFile -UseBasicParsing -TimeoutSec 60 -ErrorAction Stop
} catch {
    Write-Err "Download failed: $DownloadUrl"
    Write-Err $_.Exception.Message
    Write-Host "Release $LatestTag may not have $BinaryName yet — check https://github.com/$Repo/releases/tag/$LatestTag" -ForegroundColor Yellow
    & $Cleanup
    exit 1
}

if (-not (Test-Path $TmpFile) -or (Get-Item $TmpFile).Length -eq 0) {
    Write-Err "Downloaded file is missing or empty: $TmpFile"
    & $Cleanup
    exit 1
}

# 6. Optional checksum verification
Write-Info "Verifying download (if checksums available)..."
try {
    Invoke-WebRequest -Uri $ChecksumsUrl -OutFile $TmpChecksums -UseBasicParsing -TimeoutSec 15 -ErrorAction SilentlyContinue | Out-Null
    if (Test-Path $TmpChecksums) {
        $ExpectedLine = Select-String -Path $TmpChecksums -Pattern ([regex]::Escape($BinaryName)) | Select-Object -First 1
        if ($ExpectedLine) {
            $ExpectedHash = ($ExpectedLine.Line -split '\s+')[0]
            if ($ExpectedHash -and $ExpectedHash.Length -eq 64) {
                $ActualHash = (Get-FileHash -Path $TmpFile -Algorithm SHA256).Hash.ToLower()
                if ($ActualHash -eq $ExpectedHash.ToLower()) {
                    Write-Info "Checksum verified."
                } else {
                    Write-Warn "Checksum mismatch! Expected $ExpectedHash, got $ActualHash. Continuing anyway — verify https://github.com/$Repo/releases/tag/$LatestTag"
                }
            }
        } else {
            Write-Host "No checksum entry for $BinaryName — skipping verification." -ForegroundColor DarkGray
        }
    } else {
        Write-Host "No checksums.txt at release — skipping verification." -ForegroundColor DarkGray
    }
} catch {
    Write-Host "Checksum verification skipped (error: $($_.Exception.Message))" -ForegroundColor DarkGray
}

# 7. Install
$Target = Join-Path $InstallDir $TargetName
if (Test-Path $Target) {
    Write-Info "Updating existing installation at $Target"
} else {
    Write-Info "Installing to $Target"
}

try {
    # Ensure target is not in use (kill if running? not needed)
    Move-Item -Path $TmpFile -Destination $Target -Force -ErrorAction Stop
} catch {
    # Fallback: copy if move fails (e.g., cross-volume)
    try {
        Copy-Item -Path $TmpFile -Destination $Target -Force -ErrorAction Stop
        Remove-Item $TmpFile -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Err "Failed to install to $Target. Check permissions (no admin required for $InstallDir)."
        Write-Err $_.Exception.Message
        & $Cleanup
        exit 1
    }
}

# Unblock file (Windows marks downloaded files as blocked)
try { Unblock-File -Path $Target -ErrorAction SilentlyContinue } catch {}

if (-not (Test-Path $Target)) {
    Write-Err "Installed file not found: $Target"
    exit 1
}

# 8. Add to PATH if needed
$UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
$MachinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
$CombinedPath = "$UserPath;$MachinePath"

$OnPath = $false
# Check if InstallDir is already on PATH (case-insensitive)
if ($CombinedPath -split ";" | Where-Object { $_.TrimEnd("\") -eq $InstallDir.TrimEnd("\") -or $_.TrimEnd("\").ToLower() -eq $InstallDir.ToLower().TrimEnd("\") }) {
    # Also check if tars.exe is resolvable
    $Found = Get-Command $TargetName -ErrorAction SilentlyContinue
    if ($Found -and $Found.Source -eq $Target) { $OnPath = $true }
    elseif ($CombinedPath.ToLower().Contains($InstallDir.ToLower())) { $OnPath = $true }
}

if (-not $OnPath) {
    # Check if InstallDir already in User PATH string (avoid duplicate)
    $AlreadyInUserPath = $false
    if ($UserPath) {
        $Parts = $UserPath -split ";" | ForEach-Object { $_.TrimEnd("\") }
        if ($Parts -contains $InstallDir.TrimEnd("\") -or $Parts -contains $InstallDir) { $AlreadyInUserPath = $true }
    }

    if (-not $AlreadyInUserPath) {
        Write-Warn "$InstallDir is not on PATH."
        try {
            $NewUserPath = if ($UserPath) { "$UserPath;$InstallDir" } else { $InstallDir }
            [Environment]::SetEnvironmentVariable("Path", $NewUserPath, "User")
            # Also set for current process
            $env:Path = "$InstallDir;$env:Path"
            Write-Info "Added $InstallDir to user PATH."
            Write-Info "Restart your terminal or run: `$env:Path += `";$InstallDir`""
            $OnPath = $true
        } catch {
            Write-Warn "Failed to add to PATH automatically: $($_.Exception.Message)"
            Write-Host "Add it manually:" -ForegroundColor Yellow
            Write-Host "  1. Press Win+R, type sysdm.cpl, go to Advanced -> Environment Variables" -ForegroundColor Yellow
            Write-Host "  2. Edit User variable 'Path' and add: $InstallDir" -ForegroundColor Yellow
            Write-Host "  Or in PowerShell (current session): `$env:Path += `";$InstallDir`"" -ForegroundColor Yellow
        }
    } else {
        Write-Info "$InstallDir already in user PATH, but not yet in current shell. Run: `$env:Path += `";$InstallDir`""
        $env:Path = "$InstallDir;$env:Path"
        $OnPath = $true
    }
} else {
    Write-Info "TARS is already on PATH."
}

# Cleanup
& $Cleanup

# 9. Success
Write-Host ""
Write-Host "✓ TARS $LatestTag installed successfully!" -ForegroundColor Green
Write-Host "  Binary: $Target" -ForegroundColor Green
if (Get-Command $TargetName -ErrorAction SilentlyContinue) {
    Write-Host "  Run:    $TargetName" -ForegroundColor Green
} else {
    Write-Host "  Run:    $Target  (or restart terminal)" -ForegroundColor Green
}
Write-Host "  Update: irm https://raw.githubusercontent.com/$Repo/main/install.ps1 | iex" -ForegroundColor Gray
Write-Host ""
