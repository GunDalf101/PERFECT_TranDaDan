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
