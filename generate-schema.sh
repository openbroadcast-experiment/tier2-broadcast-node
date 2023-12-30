#!/bin/sh

#pnpm drizzle-kit introspect:pg --driver pg --connectionString="$DATABASE_URL" --introspect-casing=camel --out=./src/__generated__

npx prisma db pull --schema=./schema.prisma
npx prisma generate --schema=./schema.prisma