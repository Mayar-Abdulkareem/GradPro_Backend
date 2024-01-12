FROM node:20.11-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

ENV NODE_ENV production

CMD ["node", "server.js"]
