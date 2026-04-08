#!/bin/bash
# CPE Ctrl Build Script
# Builds backend and frontend, generates OTA package

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "=========================================="
echo "  CPE Ctrl Build Script"
echo "=========================================="
echo ""

# Parse arguments
BUILD_BACKEND=true
BUILD_FRONTEND=true
USE_UPX=true
PACK_OTA=false

for arg in "$@"; do
    case $arg in
        --backend-only)
            BUILD_FRONTEND=false
            ;;
        --frontend-only)
            BUILD_BACKEND=false
            ;;
        --no-upx)
            USE_UPX=false
            ;;
        --ota)
            PACK_OTA=true
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --backend-only   Build only backend"
            echo "  --frontend-only  Build only frontend"
            echo "  --no-upx         Skip UPX compression"
            echo "  --ota            Generate OTA package"
            echo "  --help, -h       Show this help"
            exit 0
            ;;
    esac
done

# ==================== Version ====================
VERSION="0.1.0"

# ==================== Build Frontend ====================
if [ "$BUILD_FRONTEND" = true ]; then
    echo "🎨 Building frontend..."
    echo ""
    
    cd "$PROJECT_DIR/web"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    # Build
    npm run build
    
    echo ""
    echo "✅ Frontend build complete!"
    echo "📍 Output: $PROJECT_DIR/web/dist/"
    echo ""
fi

# ==================== Build Backend ====================
if [ "$BUILD_BACKEND" = true ]; then
    echo "🦀 Building backend (aarch64-unknown-linux-musl)..."
    echo ""
    
    cd "$PROJECT_DIR/backend"
    
    # Check cross-compiler
    if ! command -v aarch64-unknown-linux-musl-gcc &> /dev/null; then
        echo "❌ Error: aarch64-unknown-linux-musl-gcc not found"
        echo ""
        echo "Install with:"
        echo "  brew tap messense/macos-cross-toolchains"
        echo "  brew install aarch64-unknown-linux-musl"
        exit 1
    fi
    
    # Set cross-compile environment
    export CC_aarch64_unknown_linux_musl=aarch64-unknown-linux-musl-gcc
    export CXX_aarch64_unknown_linux_musl=aarch64-unknown-linux-musl-g++
    export AR_aarch64_unknown_linux_musl=aarch64-unknown-linux-musl-ar
    
    cargo build --release --target aarch64-unknown-linux-musl
    
    # Find binary
    if [ -f "target/aarch64-unknown-linux-musl/release/cpe-ctrl" ]; then
        BINARY_PATH="target/aarch64-unknown-linux-musl/release/cpe-ctrl"
    elif [ -f "target/release/cpe-ctrl" ]; then
        BINARY_PATH="target/release/cpe-ctrl"
    else
        echo "❌ Error: Binary not found"
        exit 1
    fi
    
    echo ""
    echo "✅ Backend build complete!"
    echo "📍 Binary: $PROJECT_DIR/backend/$BINARY_PATH"
    ls -lh "$BINARY_PATH"
    
    # UPX compression
    if [ "$USE_UPX" = true ] && command -v upx &> /dev/null; then
        echo ""
        echo "🗜️  UPX compression..."
        upx --best --lzma "$BINARY_PATH"
        ls -lh "$BINARY_PATH"
    fi
fi

# ==================== Create www directory ====================
if [ "$BUILD_FRONTEND" = true ]; then
    echo ""
    echo "📦 Creating www directory..."
    mkdir -p "$PROJECT_DIR/www"
    rm -rf "$PROJECT_DIR/www"/*
    cp -r "$PROJECT_DIR/web/dist/"* "$PROJECT_DIR/www/"
    echo "✅ www directory ready!"
fi

# ==================== Generate OTA package ====================
if [ "$PACK_OTA" = true ]; then
    echo ""
    echo "=========================================="
    echo "  Generating OTA Package"
    echo "=========================================="
    echo ""
    
    OTA_DIR="$PROJECT_DIR/release"
    mkdir -p "$OTA_DIR"
    
    # Create temp directory
    OTA_TMP=$(mktemp -d)
    trap "rm -rf $OTA_TMP" EXIT
    
    # Copy files
    cp "$PROJECT_DIR/backend/$BINARY_PATH" "$OTA_TMP/cpe-ctrl"
    chmod 755 "$OTA_TMP/cpe-ctrl"
    cp -r "$PROJECT_DIR/www" "$OTA_TMP/"
    
    # Create meta.json
    cat > "$OTA_TMP/meta.json" << EOF
{
    "version": "$VERSION",
    "build_time": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "platform": "UDX710"
}
EOF
    
    # Package
    OTA_FILE="$OTA_DIR/cpe-ctrl-ota-${VERSION}.tar.gz"
    cd "$OTA_TMP"
    tar -czf "$OTA_FILE" cpe-ctrl www meta.json
    cd "$PROJECT_DIR"
    
    echo ""
    echo "✅ OTA package created!"
    echo "📍 $OTA_FILE"
    ls -lh "$OTA_FILE"
fi

echo ""
echo "=========================================="
echo "  Build Complete!"
echo "=========================================="
echo ""
echo "To deploy:"
echo "  adb push cpe-ctrl /home/root/"
echo "  adb push www /home/root/"
