// This route publishes a message to Tier 1
// A Tier 1 node will sever a Tier 2 connection if a Tier 2 spams a Tier 1, so the Tier 2 node should implement spam protection
// See middleware/proofOfWork.ts and middleware/validateMessage.ts for basic spam protection

import {FastifyInstance, FastifyServerOptions} from "fastify";
import {Static, Type} from "@sinclair/typebox";
import {ProofOfWorkHeaders, ProofOfWorkHeadersType, requireProofOfWork} from "../middleware/proofOfWork.js";

export const PublishBody = Type.Object({
    message: Type.Object({}),
})
export type PublishBodyType = Static<typeof PublishBody>

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


export async function publish(
    server: FastifyInstance,
    options: FastifyServerOptions,
) {
    server.route < {
        Headers: ProofOfWorkHeadersType, Body: PublishBodyType > ({
            method: "POST",
            url: "/publish",
            preHandler: [requireProofOfWork],
            schema: {
                headers: ProofOfWorkHeaders,
                body: PublishBody,
            },
            handler: async (request, reply) => {
                // const jwt = request.headers["jwt"];                   // signed JDT to verify
                // const endpoint = request.headers["endpoint"];         // user endpoint
                const {message} = request.body

                await save_publish_data(did, proofOfWork, jwt, text, endpoint);

                return reply.status(200).send();
            }
        })
    }
}