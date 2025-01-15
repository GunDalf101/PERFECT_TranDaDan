FROM node:20 as build
WORKDIR /app
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install --legacy-peer-deps
COPY ./frontend ./
RUN npm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443

FROM nginx:latest

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/nginx/ssl

RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/server.key \
    -out /etc/nginx/ssl/server.crt \
    -subj "/C=MA/ST=Casablanca/L=Casablanca/O=TranDaDan/OU=IT/CN=localhost"

COPY nginx.conf /etc/nginx/nginx.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
EXPOSE 443
