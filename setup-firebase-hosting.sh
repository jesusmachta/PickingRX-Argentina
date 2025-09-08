#!/bin/bash

echo "🔧 Setting up Firebase hosting targets..."

# Configurar los hosting targets para development y production
echo "Setting development hosting target..."
firebase target:apply hosting development picking-cds-ar

echo "Setting production hosting target..."
firebase target:apply hosting production picking-cds-ar

echo "✅ Firebase hosting targets configured!"

echo "🔑 Generating Firebase CI token..."
echo "Run the following command to generate your Firebase token:"
echo "firebase login:ci"
echo ""
echo "Copy the generated token and add it as FIREBASE_TOKEN secret in GitHub"

echo "📋 Firebase hosting targets setup complete!"
echo "Development URL: https://picking-cds-ar.web.app/"
echo "Production URL: https://picking-cds-ar.firebaseapp.com/"
