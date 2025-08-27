FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

ENV DOCKER=true
# Для продакшена
#ENV NODE_ENV=production

# Для продакшена лучше использовать build + serve:
# RUN npm run build
# CMD ["npm", "run", "preview", "--", "--host"]

CMD ["npm", "run", "dev", "--", "--host"]