# AWS Lambda container image. Build from the repository root:
#   docker build -f packages/aws-lambda/Dockerfile -t hfr-lambda .
# Push to ECR and create the function with: memory 10240 MB, timeout 900 s, ephemeral storage 4096 MB.
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /var/task
COPY package.json package-lock.json tsconfig.json ./
COPY packages ./packages
RUN npm ci --omit=dev --workspaces --include-workspace-root \
 && npx playwright-core install --with-deps chromium \
 && npm install --no-save aws-lambda-ric@3.3.0

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright HOME=/tmp
# Lambda only allows writes to /tmp: keep caches there
ENV HFR_CACHE_DIR=/tmp/hfr-cache
ENTRYPOINT ["npx", "aws-lambda-ric"]
CMD ["packages/aws-lambda/src/lambda.handler"]
