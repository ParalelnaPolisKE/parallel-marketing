FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

COPY tsconfig.json index.ts ./
RUN pnpm build

EXPOSE 3111
CMD ["node", "dist/index.js"]
