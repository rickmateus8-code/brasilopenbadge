FROM node:20-slim

WORKDIR /app

# Instalar dependências globais
RUN apt-get update && apt-get install -y git python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Instala com as dependências do DocMaster (Vite + Wrangler)
RUN npm install

COPY . .

# 5173 para Vite, 8787 para Worker (emulado pelo Wrangler)
EXPOSE 5173 8787 8788

# Script para rodar o ambiente de desenvolvimento completo
CMD ["npm", "run", "dev"]
