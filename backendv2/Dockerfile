# ============================================
# Salifz Backend — image de l'API
# ============================================

# Node 18 était figé ici alors que le projet tourne sur Node 24 en local :
# faire diverger l'environnement de développement et celui du conteneur revient
# à tester autre chose que ce qu'on déploie.
FROM node:22-alpine

LABEL maintainer="Salifz"
LABEL version="3.0.0"

WORKDIR /app

# Les dépendances sont copiées seules d'abord : la couche est réutilisée tant
# que package.json ne change pas, ce qui évite de tout réinstaller à chaque
# modification de code.
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Les enregistrements de récitation sont écrits ici ; le volume est monté
# par docker-compose pour qu'ils survivent à la recréation du conteneur.
RUN mkdir -p /app/uploads/recitations

# Le conteneur ne tourne pas en root : une faille d'exécution de code n'y
# obtient alors pas les droits d'administration de l'image.
RUN chown -R node:node /app
USER node

EXPOSE 8088

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8088/api/v1/health || exit 1

CMD ["node", "index.js"]
