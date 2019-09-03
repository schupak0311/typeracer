FROM node:10.16.0-alpine

COPY data ./data
COPY models ./models
COPY public ./public
COPY views ./views
COPY package.json ./
COPY passport.config.js ./
COPY server.js ./
RUN npm install

CMD ["node", "server.js"]
EXPOSE 3000