FROM node:20

WORKDIR /app

# Pre-install common dependencies that every preview needs
# This saves 10-20 seconds on each deploy by avoiding repeated npm installs
RUN npm init -y && npm install \
  react@18 \
  react-dom@18 \
  vite@5 \
  @vitejs/plugin-react@4 \
  tailwindcss@3 \
  typescript@5 \
  @types/react@18 \
  @types/react-dom@18 \
  postcss \
  autoprefixer \
  pako

# Keep node_modules in a known location for copying during deploy
ENV NODE_PATH=/app/node_modules
