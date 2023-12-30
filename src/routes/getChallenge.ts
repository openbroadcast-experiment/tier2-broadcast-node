import {FastifyInstance, FastifyServerOptions} from 'fastify';

export default async function getChallengeRoute(
    server: FastifyInstance,
    options: FastifyServerOptions,
) {
    server.route({
        method: "GET",
        url: "/proofOfWork/getChallenge",
        schema: {},
        handler: async (request, reply) => {
            return reply.status(200).send({serverDid: "TODO REPLACE ME WITH SERVER PUBKEY"});
        },
    });
}


