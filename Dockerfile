# Use official Bun image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
COPY prisma/schema.prisma /temp/dev/prisma/schema.prisma
RUN cd /temp/dev && bun install --frozen-lockfile

# Install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
COPY prisma/schema.prisma /temp/prod/prisma/schema.prisma
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy node_modules from temp directory
# Then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# Copy production dependencies and source code into final image
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY --from=prerelease /app/index.ts .
COPY --from=prerelease /app/package.json .
COPY --from=prerelease /app/src ./src
COPY --from=prerelease /app/docs ./docs
COPY --from=prerelease /app/dsa-sheets ./dsa-sheets
COPY --from=prerelease /app/prisma ./prisma
COPY --from=install /temp/prod/src/generated ./src/generated

# Expose port
EXPOSE 3000

# Run the app
USER bun
CMD ["bun", "run", "start"]
