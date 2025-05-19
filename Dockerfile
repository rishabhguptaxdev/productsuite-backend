FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

EXPOSE 5050

CMD ["node", "index.js"]
