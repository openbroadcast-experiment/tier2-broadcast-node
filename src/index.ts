import cors from '@fastify/cors';
import fastify from 'fastify';
import getChallengeRoute from "./routes/getChallenge.js";
import {PrismaClient} from '@prisma/client'
import {publishRoute} from "./routes/publish.js";
import {TypeBoxTypeProvider} from "@fastify/type-provider-typebox"; //Generate this with `npx prisma generate`

export const prisma = new PrismaClient()

const server = fastify({
    logger: true
}).withTypeProvider<TypeBoxTypeProvider>();
server.register(cors, {
    origin: '*',
});

server.register(getChallengeRoute); // /getChallenge
server.register(publishRoute); // /publish

server.listen(
    {
        port: process.env['port'] ? parseInt(process.env['port']) : 8080,
        host: '0.0.0.0',
    },
    (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server listening at ${address}`);
    },
);

const listeners = ['SIGINT', 'SIGTERM'];
listeners.forEach((signal) => {
    process.on(signal, async () => {
        await server.close();
        process.exit(0);
    });
});


