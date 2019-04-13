FROM node:10-slim

ENV TSC_VERSION 3.2.4

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

ARG PORT=3000
ENV PORT $PORT

RUN mkdir -p /var/www/{.npm,.node-gyp,app} /var/www/app/app
RUN npm install -g typescript@$TSC_VERSION @nestjs/cli

WORKDIR /var/www/app/app
COPY ./app/package.json ./app/package-lock*.json ./
RUN npm install --quiet --production

COPY ./app .

CMD ["npm", "run", "start:prod"]
