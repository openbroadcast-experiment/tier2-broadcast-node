
// What needs to happen:
// Proof of latency can be initiated from both tier 2 and tier 1, but since the hackathon only has one tier 1 node, the only important PoL is Tier1 -> Tier 2
// Tier 1 has a list of Tier 2 peers
// Tier 1 periodically initiaties a proof of latency check against all Tier 2 nodes
// For each Tier 2 node:
// Tier 1 sends a JWT with the start time encoded to Tier 2
// Tier 2 verifies the JWT, gets the start time from the payload, and creates a new JWT
// Tier 2 sends the new JWT back to tier1
// Tier 1 verifies the Tier 2 JWT and records the time lag
// IF tier 2 doesn't respond by TIMEOUT, tier 1 severs the connection to tier 2

import * as didJWT from 'did-jwt'; //NEW WINNER  didJWT.ES256KSigner(didJWT.hexToBytes(debug_parent_privatekey))
import { FastifyInstance, FastifyServerOptions } from "fastify";
import { config } from "../config.js";
import { JwtVerifyHeaders, JwtVerifyHeadersType, verifySelfSignedJwt } from '../middleware/verifyJwt.js';

export async function proofOfLatencyRoute(
    server: FastifyInstance,
    options: FastifyServerOptions,
) {
    server.post<{ Headers: JwtVerifyHeadersType, jwt: string }>("/proofOfLatency", {
        preHandler: [verifySelfSignedJwt],
        schema: {
            headers: { ...JwtVerifyHeaders },
            body: {},
        },
        handler: async (request, reply) => {
            const { jwt } = request; //These are added by verifyJwt preHandlers

            const { payload } = didJWT.decodeJWT(jwt)

            const respondingJwt = await didJWT.createJWT(
                {
                    latency_time_stamp_check: payload.latency_time_stamp_check,
                    userEndpoint: process.env.MY_ENDPOINT,
                    userDid: process.env.USER_DID
                },
                { issuer: config.did, signer: config.didJwtSigner },
                { alg: 'ES256K' });

            return reply.status(200).send(respondingJwt);
        }
    });
}
