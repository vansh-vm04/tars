#!/bin/sh
# TARS Standalone Installer — macOS / Linux
# Installs the latest TARS binary with embedded Bun runtime to ~/.local/bin/tars
# Usage: curl -fsSL https://raw.githubusercontent.com/vansh-vm04/tars/main/install.sh | sh
# Safe to re-run to update.

set -eu

REPO="vansh-vm04/tars"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"
BIN_NAME="tars"
BINARY=""
CHECKSUMS_FILE="checksums.txt"

# Colors (disabled if not a tty)
if [ -t 1 ]; then
  GREEN='\033[0;32m'
  YELLOW='\033[1;33m'
  RED='\033[0;31m'
  DIM='\033[2m'
  NC='\033[0m'
else
  GREEN=''; YELLOW=''; RED=''; DIM=''; NC=''
fi

info()  { printf "${GREEN}info${NC}: %s\n" "$*"; }
warn()  { printf "${YELLOW}warn${NC}: %s\n" "$*"; }
error() { printf "${RED}error${NC}: %s\n" "$*" >&2; }
die()   { error "$*"; exit 1; }

# 1. Detect OS
OS="$(uname -s 2>/dev/null || echo unknown)"
case "$OS" in
  Darwin) OS="darwin" ;;
  Linux)  OS="linux" ;;
  *) die "Unsupported OS: $OS. TARS supports macOS (Darwin) and Linux. For Windows, use install.ps1" ;;
esac

# 2. Detect arch
ARCH="$(uname -m 2>/dev/null || echo unknown)"
case "$ARCH" in
  x86_64|amd64) ARCH="x64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) die "Unsupported architecture: $ARCH. Supported: x64, arm64 (aarch64)" ;;
esac

# 3. Map to binary
case "${OS}-${ARCH}" in
  darwin-x64)   BINARY="tars-darwin-x64" ;;
  darwin-arm64) BINARY="tars-darwin-arm64" ;;
  linux-x64)    BINARY="tars-linux-x64" ;;
  linux-arm64)  BINARY="tars-linux-arm64" ;;
  *) die "Unsupported platform: ${OS}-${ARCH}" ;;
esac

info "Detected platform: ${OS}-${ARCH} → ${BINARY}"

# 4. Check for required tools
for cmd in curl uname mktemp chmod; do
  command -v "$cmd" >/dev/null 2>&1 || die "Required command not found: $cmd"
done

# Prefer curl, fallback to wget
DOWNLOADER=""
if command -v curl >/dev/null 2>&1; then
  DOWNLOADER="curl"
elif command -v wget >/dev/null 2>&1; then
  DOWNLOADER="wget"
else
  die "Neither curl nor wget found. Please install curl."
fi

# 5. Determine latest release
info "Finding latest TARS release (https://github.com/${REPO})..."

API_URL="https://api.github.com/repos/${REPO}/releases/latest"
LATEST_JSON=""
if [ "$DOWNLOADER" = "curl" ]; then
  LATEST_JSON="$(curl -fsSL --retry 3 --connect-timeout 10 "$API_URL" 2>/dev/null || true)"
else
  LATEST_JSON="$(wget -qO- --tries=3 --timeout=10 "$API_URL" 2>/dev/null || true)"
fi

if [ -z "$LATEST_JSON" ]; then
  die "Failed to fetch latest release info from $API_URL. Check your internet connection and that https://github.com/${REPO} exists."
fi

# Extract tag_name without jq (avoid extra dependency)
# Looks for: "tag_name": "v1.2.0",
TAG="$(printf "%s" "$LATEST_JSON" | grep -o '"tag_name"[[:space:]]*:[[:space:]]*"[^"]*"' | head -n1 | sed -E 's/.*"([^"]+)".*/\1/')"

if [ -z "$TAG" ]; then
  # Fallback: try to parse with sed if grep failed
  TAG="$(printf "%s" "$LATEST_JSON" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"
fi

if [ -z "$TAG" ]; then
  die "Could not determine latest release tag. Response: $(printf "%s" "$LATEST_JSON" | head -c 200)"
fi

info "Latest release: ${TAG}"

DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${TAG}/${BINARY}"
CHECKSUMS_URL="https://github.com/${REPO}/releases/download/${TAG}/${CHECKSUMS_FILE}"

info "Download URL: ${DOWNLOAD_URL}"

# 6. Prepare install dir
mkdir -p "$INSTALL_DIR" || die "Failed to create install directory: $INSTALL_DIR"
TMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t tars-install)"
TMP_BIN="$TMP_DIR/$BINARY"
TMP_CHECKSUMS="$TMP_DIR/$CHECKSUMS_FILE"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT INT TERM

# 7. Download binary
info "Downloading ${BINARY}..."

if [ "$DOWNLOADER" = "curl" ]; then
  if ! curl -fL --retry 3 --connect-timeout 15 --progress-bar "$DOWNLOAD_URL" -o "$TMP_BIN"; then
    die "Download failed: $DOWNLOAD_URL (release ${TAG} may not have ${BINARY} yet — check https://github.com/${REPO}/releases/tag/${TAG})"
  fi
else
  if ! wget -q --tries=3 --timeout=15 -O "$TMP_BIN" "$DOWNLOAD_URL"; then
    die "Download failed: $DOWNLOAD_URL"
  fi
fi

if [ ! -s "$TMP_BIN" ]; then
  die "Downloaded file is empty: $TMP_BIN"
fi

# 8. Optional checksum verification (best-effort, no hard fail if checksums missing)
info "Verifying download (if checksums available)..."
CHECKSUM_OK=0
if [ "$DOWNLOADER" = "curl" ]; then
  curl -fsSL --retry 2 --connect-timeout 10 "$CHECKSUMS_URL" -o "$TMP_CHECKSUMS" 2>/dev/null || true
else
  wget -q --tries=2 --timeout=10 -O "$TMP_CHECKSUMS" "$CHECKSUMS_URL" 2>/dev/null || true
fi

if [ -s "$TMP_CHECKSUMS" ]; then
  # Find expected checksum for this binary
  EXPECTED="$(grep -F " $BINARY" "$TMP_CHECKSUMS" 2>/dev/null | awk '{print $1}' || true)"
  # macOS may have different format: try first field
  if [ -z "$EXPECTED" ]; then
    EXPECTED="$(grep -F "$BINARY" "$TMP_CHECKSUMS" 2>/dev/null | head -n1 | awk '{print $1}' || true)"
  fi
  if [ -n "$EXPECTED" ]; then
    ACTUAL=""
    if command -v sha256sum >/dev/null 2>&1; then
      ACTUAL="$(sha256sum "$TMP_BIN" | awk '{print $1}')"
    elif command -v shasum >/dev/null 2>&1; then
      ACTUAL="$(shasum -a 256 "$TMP_BIN" | awk '{print $1}')"
    fi
    if [ -n "$ACTUAL" ]; then
      if [ "$ACTUAL" = "$EXPECTED" ]; then
        info "Checksum verified."
        CHECKSUM_OK=1
      else
        warn "Checksum mismatch! Expected $EXPECTED, got $ACTUAL. Continuing anyway — but verify https://github.com/${REPO}/releases/tag/${TAG}"
      fi
    else
      warn "No sha256sum/shasum found — skipping checksum verification."
    fi
  else
    warn "No checksum entry for $BINARY in $CHECKSUMS_FILE — skipping verification."
  fi
else
  printf "${DIM}No checksums.txt at release — skipping verification.${NC}\n"
fi

# 9. Install
TARGET="$INSTALL_DIR/$BIN_NAME"
# If an existing install exists, it will be overwritten (update)
if [ -f "$TARGET" ]; then
  info "Updating existing installation at $TARGET"
else
  info "Installing to $TARGET"
fi

# Use mv for atomic replace
if ! mv "$TMP_BIN" "$TARGET" 2>/dev/null; then
  # Fallback to cp + rm if mv across filesystems fails
  cp "$TMP_BIN" "$TARGET" || die "Failed to install to $TARGET (try with INSTALL_DIR override or check permissions)"
  rm -f "$TMP_BIN"
fi

chmod +x "$TARGET" || die "Failed to make $TARGET executable"
trap - EXIT INT TERM
rm -rf "$TMP_DIR"

# Verify
if [ ! -x "$TARGET" ]; then
  die "Installed file is not executable: $TARGET"
fi

# 10. Ensure INSTALL_DIR is on PATH
# Check if target is already on PATH (resolves to our install)
if command -v "$BIN_NAME" >/dev/null 2>&1; then
  FOUND="$(command -v "$BIN_NAME" 2>/dev/null || true)"
  if [ "$FOUND" = "$TARGET" ]; then
    ON_PATH=1
  else
    ON_PATH=0
  fi
else
  ON_PATH=0
fi

if [ "${ON_PATH:-0}" -eq 1 ]; then
  info "TARS is already on PATH."
else
  # Determine shell profile to update
  SHELL_NAME="$(basename "${SHELL:-sh}")"
  PROFILE=""
  case "$SHELL_NAME" in
    zsh)  PROFILE="$HOME/.zshrc" ;;
    bash) 
      if [ -f "$HOME/.bashrc" ]; then PROFILE="$HOME/.bashrc"
      elif [ -f "$HOME/.bash_profile" ]; then PROFILE="$HOME/.bash_profile"
      else PROFILE="$HOME/.bashrc"
      fi
      ;;
    fish) PROFILE="$HOME/.config/fish/config.fish" ;;
    *)    PROFILE="$HOME/.profile" ;;
  esac

  # Check if INSTALL_DIR is already in PATH via profile
  NEED_ADD=1
  if [ -f "$PROFILE" ] && grep -qF "$INSTALL_DIR" "$PROFILE" 2>/dev/null; then
    NEED_ADD=0
  fi

  if [ "$NEED_ADD" -eq 1 ]; then
    # Try to add to profile
    {
      echo ""
      echo "# TARS - added by install.sh on $(date -u +%Y-%m-%d)"
      if [ "$SHELL_NAME" = "fish" ]; then
        echo "fish_add_path \"$INSTALL_DIR\"  # TARS"
      else
        echo "export PATH=\"$INSTALL_DIR:\$PATH\"  # TARS"
      fi
    } >> "$PROFILE" 2>/dev/null || true

    if [ -f "$PROFILE" ] && grep -qF "$INSTALL_DIR" "$PROFILE" 2>/dev/null; then
      warn "Added $INSTALL_DIR to PATH in $PROFILE"
      info "Restart your terminal or run: export PATH=\"$INSTALL_DIR:\$PATH\""
    else
      warn "$INSTALL_DIR is not on PATH."
      info "Add it manually:"
      if [ "$SHELL_NAME" = "fish" ]; then
        printf "  fish_add_path \"%s\"\n" "$INSTALL_DIR"
      else
        printf "  export PATH=\"%s:\$PATH\"\n" "$INSTALL_DIR"
      fi
      printf "  (add to %s to make permanent)\n" "$PROFILE"
    fi
  else
    info "$INSTALL_DIR already in $PROFILE, but not yet in current shell."
    info "Run: export PATH=\"$INSTALL_DIR:\$PATH\""
  fi

  # Also export for current shell if we can
  case ":$PATH:" in
    *":$INSTALL_DIR:"*) ;;
    *) export PATH="$INSTALL_DIR:$PATH" 2>/dev/null || true ;;
  esac
fi

# 11. Success
printf "\n"
printf "${GREEN}✓ TARS %s installed successfully!${NC}\n" "$TAG"
printf "  Binary: ${GREEN}%s${NC}\n" "$TARGET"
if command -v "$BIN_NAME" >/dev/null 2>&1; then
  printf "  Run:    ${GREEN}%s${NC}\n" "$BIN_NAME"
else
  printf "  Run:    ${GREEN}%s${NC}  (or restart terminal)\n" "$TARGET"
fi
printf "  Update: curl -fsSL https://raw.githubusercontent.com/${REPO}/main/install.sh | sh\n"
printf "\n"
