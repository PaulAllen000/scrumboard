FROM node:18-alpine AS builder

WORKDIR /app

COPY scrum-ui/package*.json ./scrum-ui/

WORKDIR /app/scrum-ui
RUN npm install

COPY scrum-ui /app/scrum-ui

RUN npm run build -- --configuration production

FROM nginx:latest AS runner

COPY default.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
