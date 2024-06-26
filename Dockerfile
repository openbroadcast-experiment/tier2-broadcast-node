# Phase 1: Build
ARG GO_VERSION=1.21


FROM node:21-alpine as build

WORKDIR /usr/src/app
RUN apk add --update --no-cache python3 make g++ git

COPY package*.json ./
RUN npm install -g pnpm

RUN pnpm install

COPY . .
RUN npx prisma generate && pnpm run build

# Phase 2: Run
FROM node:21-alpine

WORKDIR /usr/src/app

RUN npm install -g pnpm

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.json ./
EXPOSE 8080

CMD pnpm run migrate:docker && pnpm start
#CMD tail -f /dev/null