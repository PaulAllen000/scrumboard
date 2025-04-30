FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npx ng build --configuration production

FROM node:20 AS runner

WORKDIR /app

RUN npm install -g http-server

COPY --from=builder /app/dist/scrum-ui /app

EXPOSE 8080
CMD ["http-server", ".", "-p", "8080"]
