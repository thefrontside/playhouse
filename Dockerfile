FROM node:16-bullseye-slim

# Set Python interpreter for `node-gyp` to use
ENV PYTHON /usr/bin/python3

# From here on we use the least-privileged `node` user to run the backend.
WORKDIR /app
RUN chown node:node /app
USER node

# This switches many Node.js dependencies to production mode.
ENV NODE_ENV production

# Copy repo skeleton first, to avoid unnecessary docker cache invalidation.
# The skeleton contains the package.json of each package in the monorepo,
# and along with yarn.lock and the root package.json, that's enough to run yarn install.
COPY .yarn ./.yarn
COPY .yarnrc.yml ./
COPY --chown=node:node yarn.lock package.json packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

# this command does not support the immutable flag
# but we use it for the initial build in github actions
RUN yarn workspaces focus --all --production && rm -rf "$(yarn cache clean)"

# Then copy the rest of the backend bundle, along with any other files we might want.
COPY --chown=node:node packages/backend/dist/bundle.tar.gz app-config*.yaml ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

CMD ["node", "packages/backend", "--config", "app-config.yaml"]
