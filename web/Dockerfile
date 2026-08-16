# ============================================================
# Application web Salifz
#
# Deux cibles dans un même fichier :
#   - `dev`  : serveur Vite avec rechargement à chaud
#   - `prod` : build statique servi par nginx (cible par défaut)
#
# Un serveur de développement n'a pas sa place en production : il recompile à
# la volée, expose la carte des sources et ne sait pas mettre en cache.
# ============================================================

# ---------- développement ----------
FROM node:22-alpine AS dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---------- construction ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Vite fige les variables `VITE_*` au moment du build : elles doivent donc
# être fournies ici, pas au démarrage du conteneur.
ARG VITE_API_URL=/api/v1
ARG VITE_WS_URL=/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

# ---------- production ----------
FROM nginx:1.27-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
