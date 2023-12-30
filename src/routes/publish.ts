// This route publishes a message to Tier 1
// A Tier 1 node will sever a Tier 2 connection if a Tier 2 spams a Tier 1, so the Tier 2 node should implement spam protection
// See middleware/proofOfWork.ts and middleware/validateMessage.ts for basic spam protection

import {FastifyInstance, FastifyServerOptions} from "fastify";
import {Static, Type} from "@sinclair/typebox";
import {ProofOfWorkHeaders, ProofOfWorkHeadersType, requireProofOfWork} from "../middleware/proofOfWork.js";
import {JwtVerifyHeaders, JwtVerifyHeadersType, verifyJwt} from "../middleware/vertifyJwt.js";
import {prisma} from "../index.js";
import {config} from "../config.js";

export const PublishBody = Type.Object({
    message: Type.String(), //TODO A string will work for now, but we need this to be "any" with an encoding param later
})
export type PublishBodyType = Static<typeof PublishBody>

export async function publishRoute(
    server: FastifyInstance,
    options: FastifyServerOptions,
) {
    server.post<{ Headers: ProofOfWorkHeadersType & JwtVerifyHeadersType, Body: PublishBodyType , jwt: string}>("/publish", {
        preHandler: [requireProofOfWork, verifyJwt],
        schema: {
            headers: {...ProofOfWorkHeaders, ...JwtVerifyHeaders},
            body: PublishBody,
        },
        handler: async (request, reply) => {
            const {message} = request.body

            const {jwt, userDid, powSolution} = request; //These are added by requireProofOfWork and verifyJwt preHandlers
            // console.log(`Writing client message from ${clientDid} to my own database`)
            const res = await prisma.published_data.create({
                data: {
                    user_did: "TODO REPLACE ME WITH SERVER PUBKEY",
                    user_jwt: "TODO REPLACE ME WITH SERVER PUBKEY",
                    user_pow_solution: "TODO REPLACE ME WITH SERVER PUBKEY",
                    tier1_endpoint: config.tier1Endpoint,
                    message: JSON.stringify(message),
                }
            })

            console.log("This is where I'd send the message to Tier 1... if I had a Tier 1")

            return reply.status(200).send(res);
        }
    });
}
