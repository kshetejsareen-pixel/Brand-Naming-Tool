#!/bin/bash
# Deploy to Vercel production
# Run: bash deploy.sh
# Or make executable: chmod +x deploy.sh && ./deploy.sh

set -e

echo "Building and deploying Brand Naming Tool..."

/Users/ks/.local/node_modules/.bin/vercel --prod --yes --scope kshetejsareen-pixels-projects

echo "Done. Live at https://brand-naming-tool.vercel.app"
