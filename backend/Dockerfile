FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/main.js"]