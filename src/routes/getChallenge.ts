import {FastifyInstance, FastifyServerOptions} from 'fastify';
import {config} from "../config.js";

export default async function getChallengeRoute(
    server: FastifyInstance,
    options: FastifyServerOptions,
) {
    server.route({
        method: "GET",
        url: "/proofOfWork/getChallenge",
        schema: {},
        handler: async (request, reply) => {
            return reply.status(200).send({serverDid: config.did});
        },
    });
}


