# ---- Build Stage ----
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]


#A la hora de correr el contenedor en linux, usar los siguientes comandos:
    #sudo docker build -t nest-app .
    #sudo docker run -p 3000:3000 nest-app
#A la hora de correr el contenedor en Windows, usar los siguientes comandos:
    #docker build -t nest-app .
    #docker run -p 3000:3000 nest-app

