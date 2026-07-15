#!/bin/bash

# 🚀 Script de setup - Module Gestion des Utilisateurs

echo "📦 StockFlow - Setup Module Utilisateurs"
echo "========================================"
echo ""

# 1. Backend Setup
echo "1️⃣ Configuration Backend..."
cd backend
cp .env.example .env
echo "   ✅ .env créé - À éditer avec vos paramètres"
echo ""

echo "2️⃣ Installation dépendances Backend..."
npm install
echo "   ✅ npm install done"
echo ""

# 2. Database Setup
echo "3️⃣ Configuration Base de Données..."
echo "   Exécutez manuellement :"
echo "   $ createdb stockflow"
echo "   $ psql -U postgres -d stockflow -f backend/schema.sql"
echo ""

# 3. Frontend Setup
echo "4️⃣ Installation dépendances Frontend..."
cd ..
npm install axios date-fns
echo "   ✅ axios et date-fns installés"
echo ""

echo "5️⃣ Configuration variables Frontend..."
echo "   Créez/modifiez .env.local :"
echo "   VITE_API_URL=http://localhost:3000/api"
echo ""

echo "========================================"
echo "🎉 Setup terminé !"
echo ""
echo "Prochaines étapes :"
echo "1. Éditer backend/.env avec vos paramètres DB"
echo "2. Créer la base de données PostgreSQL"
echo "3. Charger le schéma : psql -U postgres -d stockflow -f backend/schema.sql"
echo "4. Démarrer backend : cd backend && npm run dev"
echo "5. Démarrer frontend : npm run dev"
echo ""
echo "📖 Voir QUICK_START_USERS.md pour plus de détails"

