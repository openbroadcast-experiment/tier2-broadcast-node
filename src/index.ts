import cors from '@fastify/cors';
import fastify from 'fastify';


const server = fastify({
    logger: true
});
server.register(cors, {
    origin: '*',
});

server.register(registerApi);

// server.get('/', async (request, reply) => {
//   return reply.send(rustLib.hello());
// })

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

//
// if (require.main === module) {
//   // called directly i.e. "node app"
//   await init().listen({ port: 8080 }, (err) => {
//     if (err) console.error(err);
//     console.log('server listening on 3000');
//   });
// } else {
//   // required as a module => executed on aws lambda
//   module.exports = init;
// }

// module.exports = init;

