FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN DATABASE_URL=postgresql://example:example@localhost:5432/example \
    DIRECT_URL=postgresql://example:example@localhost:5432/example \
    npx prisma generate
RUN npm run build

EXPOSE 4000

CMD ["sh", "-c", "npx prisma db push && npm start"]
