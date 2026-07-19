FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git python3 python3-pip curl ca-certificates && \
    pip3 install --break-system-packages semgrep && \
    curl -sSfL https://raw.githubusercontent.com/gitleaks/gitleaks/master/scripts/install.sh | sh -s -- -b /usr/local/bin && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm","run","dev"]
