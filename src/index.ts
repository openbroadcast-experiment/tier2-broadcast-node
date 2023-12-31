import cors from '@fastify/cors';
import fastify from 'fastify';
import getChallengeRoute from './routes/getChallenge.js';
import { PrismaClient } from '@prisma/client';
import { publishRoute } from './routes/publish.js';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { config } from './config.js'; //Generate this with `npx prisma generate`
import { libp2pNode } from './p2p/node.js';
import p2pRoutes from './routes/p2p.js';

export const prisma = new PrismaClient();


// Start REST API server
const server = fastify({
  logger: true,
}).withTypeProvider<TypeBoxTypeProvider>();
server.register(cors, {
  origin: '*',
});

server.register(getChallengeRoute); // /getChallenge
server.register(publishRoute); // /publish
server.register(p2pRoutes); // /p2p/*
server.listen(
  {
    port: config.port,
    host: config.host,
  },
  (err, address) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`Server listening at ${address}`);
  },
);


await libp2pNode.start();
console.log('libp2p listening on addresses:');
libp2pNode.getMultiaddrs().forEach((addr) => {
  console.log(addr?.toString());
});

const listeners = ['SIGINT', 'SIGTERM'];
listeners.forEach((signal) => {
  process.on(signal, async () => {
    await server.close();
    await libp2pNode.stop();
    process.exit(0);
  });
});





