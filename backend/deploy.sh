#!/bin/bash

# ============================================
# Salifz - Script de Déploiement Automatique
# ============================================

set -e

echo "╔═══════════════════════════════════════════════════════╗"
echo "║     📖 Salifz - Déploiement Automatique           ║"
echo "╚═══════════════════════════════════════════════════════╝"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonction de log
log() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[i]${NC} $1"; }

# ============================================
# 1. VÉRIFICATION DES PRÉREQUIS
# ============================================
check_prerequisites() {
    info "Vérification des prérequis..."
    
    command -v node >/dev/null 2>&1 || error "Node.js n'est pas installé"
    command -v npm >/dev/null 2>&1 || error "npm n'est pas installé"
    command -v git >/dev/null 2>&1 || error "git n'est pas installé"
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js 18+ requis (actuel: v$NODE_VERSION)"
    fi
    
    log "Tous les prérequis sont satisfaits"
}

# ============================================
# 2. CONFIGURATION MONGODB ATLAS
# ============================================
setup_mongodb() {
    info "Configuration MongoDB Atlas..."
    echo ""
    echo "📊 INSTRUCTIONS MONGODB ATLAS:"
    echo "1. Allez sur https://www.mongodb.com/atlas/database"
    echo "2. Créez un compte gratuit ou connectez-vous"
    echo "3. Créez un nouveau cluster (M0 gratuit)"
    echo "4. Cliquez sur 'Connect' puis 'Connect your application'"
    echo "5. Copiez la connection string"
    echo ""
    read -p "Entrez votre MongoDB URI (ou appuyez sur Enter pour local): " MONGO_URI
    
    if [ -z "$MONGO_URI" ]; then
        MONGO_URI="mongodb://localhost:27017/salifz"
        warn "Utilisation de MongoDB local"
    fi
    
    # Mettre à jour .env
    sed -i "s|MONGODB_URI=.*|MONGODB_URI=$MONGO_URI|" backend/.env
    log "MongoDB configuré"
}

# ============================================
# 3. CONFIGURATION REDIS (OPTIONNEL)
# ============================================
setup_redis() {
    info "Configuration Redis (optionnel)..."
    echo ""
    echo "🔴 INSTRUCTIONS REDIS:"
    echo "Option 1 - Redis Cloud (gratuit):"
    echo "   1. Allez sur https://redis.com/try-free/"
    echo "   2. Créez un compte et une base de données gratuite"
    echo "   3. Copiez l'URL de connexion"
    echo ""
    echo "Option 2 - Local:"
    echo "   docker run -d -p 6379:6379 redis:alpine"
    echo ""
    read -p "Entrez votre Redis URL (ou appuyez sur Enter pour ignorer): " REDIS_URL
    
    if [ -n "$REDIS_URL" ]; then
        sed -i "s|REDIS_URL=.*|REDIS_URL=$REDIS_URL|" backend/.env
        log "Redis configuré"
    else
        warn "Redis ignoré (cache désactivé)"
    fi
}

# ============================================
# 4. CONFIGURATION SERVICES EXTERNES
# ============================================
setup_external_services() {
    info "Configuration des services externes..."
    
    # SendGrid
    echo ""
    echo "📧 SENDGRID (Email):"
    echo "1. Allez sur https://sendgrid.com/"
    echo "2. Créez un compte gratuit (100 emails/jour)"
    echo "3. Settings > API Keys > Create API Key"
    read -p "Entrez votre clé API SendGrid (ou Enter pour simulation): " SENDGRID_KEY
    if [ -n "$SENDGRID_KEY" ]; then
        sed -i "s|SENDGRID_API_KEY=.*|SENDGRID_API_KEY=$SENDGRID_KEY|" backend/.env
        sed -i "s|MOCK_EMAIL=.*|MOCK_EMAIL=false|" backend/.env
    fi
    
    # Twilio
    echo ""
    echo "📱 TWILIO (SMS):"
    echo "1. Allez sur https://www.twilio.com/try-twilio"
    echo "2. Créez un compte gratuit"
    echo "3. Console > Account Info > Copy SID & Token"
    read -p "Entrez votre Twilio SID (ou Enter pour simulation): " TWILIO_SID
    if [ -n "$TWILIO_SID" ]; then
        sed -i "s|TWILIO_ACCOUNT_SID=.*|TWILIO_ACCOUNT_SID=$TWILIO_SID|" backend/.env
        read -p "Entrez votre Twilio Auth Token: " TWILIO_TOKEN
        sed -i "s|TWILIO_AUTH_TOKEN=.*|TWILIO_AUTH_TOKEN=$TWILIO_TOKEN|" backend/.env
        read -p "Entrez votre numéro Twilio (+1...): " TWILIO_PHONE
        sed -i "s|TWILIO_PHONE_NUMBER=.*|TWILIO_PHONE_NUMBER=$TWILIO_PHONE|" backend/.env
        sed -i "s|MOCK_SMS=.*|MOCK_SMS=false|" backend/.env
    fi
    
    # Stripe
    echo ""
    echo "💳 STRIPE (Paiements):"
    echo "1. Allez sur https://dashboard.stripe.com/register"
    echo "2. Developers > API Keys"
    read -p "Entrez votre clé secrète Stripe (ou Enter pour ignorer): " STRIPE_KEY
    if [ -n "$STRIPE_KEY" ]; then
        sed -i "s|STRIPE_SECRET_KEY=.*|STRIPE_SECRET_KEY=$STRIPE_KEY|" backend/.env
    fi
    
    log "Services externes configurés"
}

# ============================================
# 5. INSTALLATION DES DÉPENDANCES
# ============================================
install_dependencies() {
    info "Installation des dépendances..."
    
    cd backend
    npm install --production
    cd ..
    
    cd mobile
    npm install
    cd ..
    
    log "Dépendances installées"
}

# ============================================
# 6. SEED DATABASE
# ============================================
seed_database() {
    info "Initialisation de la base de données..."
    
    cd backend
    npm run seed
    cd ..
    
    log "Base de données initialisée avec 10 comptes de test"
}

# ============================================
# 7. DÉPLOIEMENT
# ============================================
deploy_backend() {
    info "Choix de la plateforme de déploiement..."
    echo ""
    echo "Choisissez votre plateforme:"
    echo "1) Heroku (gratuit limité)"
    echo "2) Railway (gratuit 500h/mois)"
    echo "3) Render (gratuit avec limitations)"
    echo "4) DigitalOcean App Platform"
    echo "5) Local uniquement"
    echo ""
    read -p "Votre choix (1-5): " DEPLOY_CHOICE
    
    case $DEPLOY_CHOICE in
        1)
            deploy_heroku
            ;;
        2)
            deploy_railway
            ;;
        3)
            deploy_render
            ;;
        4)
            deploy_digitalocean
            ;;
        5)
            warn "Déploiement local uniquement"
            ;;
        *)
            warn "Choix invalide, déploiement local"
            ;;
    esac
}

deploy_heroku() {
    info "Déploiement sur Heroku..."
    
    command -v heroku >/dev/null 2>&1 || {
        warn "Installation de Heroku CLI..."
        curl https://cli-assets.heroku.com/install.sh | sh
    }
    
    cd backend
    heroku login
    heroku create salifz-api-$(date +%s)
    
    # Configuration des variables
    heroku config:set NODE_ENV=production
    heroku config:set JWT_SECRET=$(openssl rand -base64 32)
    
    # Déploiement
    git init
    git add .
    git commit -m "Initial deployment"
    git push heroku master
    
    API_URL=$(heroku info -s | grep web_url | cut -d= -f2)
    log "Backend déployé sur: $API_URL"
    cd ..
}

deploy_railway() {
    info "Déploiement sur Railway..."
    echo ""
    echo "INSTRUCTIONS RAILWAY:"
    echo "1. Allez sur https://railway.app/"
    echo "2. Connectez-vous avec GitHub"
    echo "3. New Project > Deploy from GitHub repo"
    echo "4. Sélectionnez le dossier backend"
    echo "5. Ajoutez les variables d'environnement"
    echo ""
    
    command -v railway >/dev/null 2>&1 || {
        npm install -g @railway/cli
    }
    
    cd backend
    railway login
    railway init
    railway up
    cd ..
    
    log "Suivez les instructions Railway pour terminer"
}

deploy_render() {
    info "Déploiement sur Render..."
    echo ""
    echo "INSTRUCTIONS RENDER:"
    echo "1. Allez sur https://render.com/"
    echo "2. New > Web Service"
    echo "3. Connectez votre repo GitHub"
    echo "4. Root Directory: backend"
    echo "5. Build Command: npm install"
    echo "6. Start Command: npm start"
    echo "7. Ajoutez les variables d'environnement"
    echo ""
    log "Suivez les instructions Render"
}

deploy_digitalocean() {
    info "Déploiement sur DigitalOcean..."
    echo ""
    echo "INSTRUCTIONS DIGITALOCEAN:"
    echo "1. Allez sur https://cloud.digitalocean.com/apps"
    echo "2. Create App > GitHub"
    echo "3. Source: backend folder"
    echo "4. Configurez les variables d'environnement"
    echo ""
    log "Suivez les instructions DigitalOcean"
}

# ============================================
# 8. RÉSUMÉ FINAL
# ============================================
print_summary() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║     ✅ DÉPLOIEMENT TERMINÉ                           ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""
    echo "📋 COMPTES DE TEST:"
    echo "   admin@salifz.com / Admin123!"
    echo "   test@salifz.com / Test123!"
    echo "   premium@salifz.com / Premium123!"
    echo ""
    echo "🚀 COMMANDES:"
    echo "   Backend:  cd backend && npm start"
    echo "   Mobile:   cd mobile && npx expo start"
    echo ""
    echo "📚 DOCUMENTATION:"
    echo "   API: http://localhost:8088/api/v1"
    echo "   Health: http://localhost:8088/api/v1/health"
    echo ""
    echo "بارك الله فيكم 🤲"
}

# ============================================
# EXÉCUTION PRINCIPALE
# ============================================
main() {
    check_prerequisites
    setup_mongodb
    setup_redis
    setup_external_services
    install_dependencies
    seed_database
    deploy_backend
    print_summary
}

# Vérifier si le script est exécuté directement
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi
