FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Build args become VITE_ env vars at build time
ARG VITE_API_URL
ARG VITE_LINKPAY_CONTRACT_ADDRESS
ARG VITE_USDC_CONTRACT_ADDRESS
ARG VITE_ARC_CHAIN_ID
ARG VITE_ARC_RPC_URL
ARG VITE_BLOCK_EXPLORER_URL
ARG VITE_APP_URL

RUN npm run build

# ─── Production image ─────────────────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# React Router support — serve index.html for all routes
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
