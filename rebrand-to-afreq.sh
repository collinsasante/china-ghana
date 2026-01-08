#!/bin/bash

# AFREQ Logistics Rebranding Script
# This script replaces all Keen Themes references with AFREQ Logistics branding

echo "Starting AFREQ Logistics rebranding..."

cd "$(dirname "$0")/frontend"

# Function to perform replacements in a file
rebrand_file() {
    local file="$1"

    # Skip if file doesn't exist or is binary
    if [ ! -f "$file" ] || file -b "$file" | grep -q "binary"; then
        return
    fi

    # Create backup
    cp "$file" "$file.bak"

    # Perform replacements (case-insensitive where appropriate)
    sed -i '' \
        -e 's/Author: Keenthemes/Author: AFREQ Logistics/g' \
        -e 's/Product Name: Keen/Product Name: AFREQ Delivery Tracking/g' \
        -e 's/KeenProduct/AFREQ Product/g' \
        -e 's/Purchase: https:\/\/keenthemes\.com\/products\/keen-html-pro/Website: https:\/\/afreqlogistics.com/g' \
        -e 's/Website: http:\/\/www\.keenthemes\.com/Website: https:\/\/afreqlogistics.com/g' \
        -e 's/Contact: support@keenthemes\.com/Contact: support@afreqlogistics.com/g' \
        -e 's/Follow: www\.twitter\.com\/keenthemes/Follow: @afreqlogistics/g' \
        -e 's/Dribbble: www\.dribbble\.com\/keenthemes//g' \
        -e 's/Like: www\.facebook\.com\/keenthemes/Like: www.facebook.com\/afreqlogistics/g' \
        -e 's/Mirrored from preview\.keenthemes\.com.*$/Customized for AFREQ Logistics -->/g' \
        -e 's/<title>Keen - Multi-demo Bootstrap 5 HTML Admin Dashboard Template by KeenThemes<\/title>/<title>AFREQ Logistics - Delivery Tracking System<\/title>/g' \
        -e 's/content="Keen - Multi-demo Bootstrap 5 HTML Admin Dashboard Template by KeenThemes"/content="AFREQ Logistics - Container Shipping and Delivery Management System"/g' \
        -e 's/content="The most advanced Bootstrap Admin Theme on Bootstrap Market.*"/content="Comprehensive container shipping and delivery management web application for AFREQ Logistics handling China-to-Ghana shipments."/g' \
        -e 's/content="keen, bootstrap, bootstrap 5.*"/content="afreq, logistics, shipping, container tracking, china to ghana, delivery management, cargo tracking"/g' \
        -e 's/https:\/\/keenthemes\.com\/keen/https:\/\/afreqlogistics.com/g' \
        -e 's/Keen by Keenthemes/AFREQ Logistics/g' \
        -e 's/BoomApp by Keenthemes/AFREQ Delivery Tracking/g' \
        -e 's/with Keen/with AFREQ/g' \
        -e 's/href="https:\/\/keenthemes\.com\/"/href="https:\/\/afreqlogistics.com"/g' \
        -e 's/>Keenthemes</>AFREQ Logistics</g' \
        -e 's/KeenThemes/AFREQ Logistics/g' \
        -e 's/Keenthemes/AFREQ Logistics/g' \
        -e 's/keenthemes\.com/afreqlogistics.com/g' \
        -e 's/preview\.keenthemes\.com\/html\/keen\/docs/docs.afreqlogistics.com/g' \
        "$file"

    # Check if file was modified
    if diff -q "$file" "$file.bak" > /dev/null; then
        # No changes, remove backup
        rm "$file.bak"
    else
        echo "✓ Updated: $file"
    fi
}

# Export function for use with find
export -f rebrand_file

# Find and process all HTML files
echo "Processing HTML files..."
find src -name "*.html" -type f -exec bash -c 'rebrand_file "$0"' {} \;

# Find and process all TypeScript/JavaScript files
echo "Processing TypeScript and JavaScript files..."
find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | while read file; do
    rebrand_file "$file"
done

# Process CSS files in assets
echo "Processing CSS files..."
find src/assets -name "*.css" -type f -exec bash -c 'rebrand_file "$0"' {} \;

# Process public assets if they exist
if [ -d "public" ]; then
    echo "Processing public assets..."
    find public -name "*.html" -o -name "*.css" -o -name "*.js" | while read file; do
        rebrand_file "$file"
    done
fi

echo ""
echo "Rebranding complete!"
echo ""
echo "Summary of changes:"
echo "- Keen Themes → AFREQ Logistics"
echo "- KeenThemes → AFREQ Logistics"
echo "- Author and contact information updated"
echo "- Meta tags and page titles updated"
echo "- URLs updated to afreqlogistics.com"
echo ""
echo "Note: Backup files with .bak extension have been created for modified files."
echo "You can remove them by running: find . -name '*.bak' -delete"
