# Cloud Run image. Build from the repository root:
#   docker build -f packages/gcp-cloud-run/Dockerfile -t hfr-render .
#   gcloud run deploy hfr-render --image … --cpu 4 --memory 8Gi --concurrency 1 --timeout 3600 --no-allow-unauthenticated
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY packages ./packages
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npm ci --omit=dev --workspaces --include-workspace-root \
 && npx playwright-core install --with-deps chromium

ENV PORT=8080
EXPOSE 8080
CMD ["node", "packages/gcp-cloud-run/src/main.ts"]
