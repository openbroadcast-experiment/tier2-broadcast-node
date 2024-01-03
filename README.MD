# Tier2 Open Broadcast Node

## Responsibilities:
* Receives messages from users/frontend
* Protects Tier 1 against spam from users/frontend
  * In practice this is done by requiring the user/frontend to submit a proof of work and requiring the message to be signed
* Sends messages to Tier 1 (so Tier 1 can broadcast to all other Tier 2 nodes)
* Notifies users of messages received from Tier 1
* (Optional) stores a copy of data to reduce load on Tier 1 (if it has to hit Tier 1 for everything, it'll trigger Tier 1's spam protection)
* (Not required for TBD hackathon) can read data from Tier 1

## Initial setup:
1. Copy .env.example to .env. **DO NOT ADJUST VALUES, .env.example CONTAINS EXACTLY WHAT YOU NEED**. For the sake of simplicity, we're going to share envvars for local development. This is so we don't have to update Insomnia w/ complex logic for our proof of work spam protection
```bash
  cp .env.example .env
```
Note that the User private key used in Insomnia is
1. Be either running postgres or run the following to launch postgres:
```bash
  docker run -d -v tier2-postgres --name tier2-postgres -p 5432:5432 -e POSTGRES_DB=node_storage -e POSTGRES_PASSWORD=postgres postgres
```
To reemphasize *everything in insomnia expects you to use the same private key for local tier2 development*. Do not change the private key.
2. Run migrations, these are safe to run multiple times:
```bash
  pnpm run migrate
```
3. Generate typescript + prisma client code from tables in the postgres database
```bash
  npx prisma db pull --schema=./schema.prisma
  npx prisma generate --schema=./schema.prisma
```
4. Run the server:
```bash
  pnpm run start
```

## Profiling
1. Install clinic
```bash
  pnpm install -g clinic
```
2. Run clinic and you'll get profiling visualizations in your web browser. Note that some parts of the script may be commented out (since the full script would open 5 windows)
    ```bash
    ./tests/clinic.sh
    ```

## Deployment

We have CI in [./.github]() that does the following:
1. Builds the docker image
2. Pushes the docker image to Docker Hub
   1. Pushes to main branch will publish to `jidotaikasuru/tier2-publication-node:latest`
   2. Any push will result in a publish to  `jidotaikasuru/tier2-publication-node:<sha>`
3. (TODO) Deploys to ECS

# Running two different instances of the server locally

(TODO) The cleanest way to run two or more instances is w/ docker-compose.yaml

For now run:
```bash
  pnpm run dev-a dev-b
```

Note: If you change the tables in the database, you need to re-run the step to generate code

If you hate yourself, you can run `pnpm fml` to create a PoW solution and JWT out of your .env. This would only ever be necessary if the shared private key we use for local development changes.