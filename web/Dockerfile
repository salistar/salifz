# Image de développement : Vite sert l'application avec rechargement à chaud.
# Pour la production, ajouter une étape de build puis servir le dossier `dist`
# derrière nginx — un serveur de développement n'a pas sa place en production.
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]
