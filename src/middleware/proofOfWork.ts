import { FastifyReply, FastifyRequest } from "fastify";
import { Static, Type } from "@sinclair/typebox";
import { argon2Verify } from "hash-wasm";
import { config } from "../config.js";
import { disallowArrayHeaders, HeaderHasArrayValueError } from "./lib.js";
import { logger } from "../logger.js";

export const ProofOfWorkHeaders = Type.Object({
    "x-pow-solution": Type.String(),
    "x-user-did": Type.String(),
})
export type ProofOfWorkHeadersType = Static<typeof ProofOfWorkHeaders>

// This spam protection middleware requires the user to submit a solved proof of work challenge to access an underlying route
// It requires the user to submit an "X-Client-DID" header containing their DID (used for verifying the challenge) and
// an "X-Proof-Of-Work" header containing the solved challenge
export const requireProofOfWork = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        console.log("Verifying the user's Proof of Work submission")
        console.log("request.headers", request.headers)
        console.log("request.headers", request.headers["x-pow-solution"])
        const headers = disallowArrayHeaders(request.headers) as ProofOfWorkHeadersType
        const clientDid = headers["x-user-did"];
        const challengeHash = headers["x-pow-solution"];

        // Check that user submitted all required headers
        if (!clientDid || !challengeHash) {
            return reply.status(400).send(`You are missing a required header`);
        }

        logger.info(clientDid, challengeHash, 'Proof of work: Start');

        request.userDid = clientDid;
        request.powSolution = challengeHash;

        // Validate that the submitted proof of work challenge is valid
        const lastPart = challengeHash.substring(challengeHash.lastIndexOf('$') + 1, challengeHash.length);
        const answerHex = Buffer.from(lastPart, 'base64').toString('hex');

        const proofOfWorkChallenge = new RegExp(config.powChallenge, "g")
        if (!answerHex.match(proofOfWorkChallenge)) {
            return reply.status(400).send(`User submitted invalid challenge hash, should end with ${config.powChallenge}`)
        }
        const isVerified = await argon2Verify({
            password: `${config.did}${clientDid}`,
            hash: challengeHash,
        });

        if (!isVerified) {
            logger.error({
                statusCode: 401,
                message: "Failed to verify pow solution",
            });
            return reply.status(401).send("Failed to verify pow solution");
        }

        logger.info({
            statusCode: 200,
            clientDid,
            challengeHash,
            message: "Proof of work: Succesfull"
        });
    } catch (e: any) {
        if (e instanceof HeaderHasArrayValueError) {
            logger.error({
                statusCode: 400,
                message: "PoW: Header Has Array Value Error",
            });
            return reply.status(400).send(e.message);
        } else {
            logger.error({
                statusCode: 500,
                message: "PoW: Unexpected error",
            });
            return reply.status(500).send(e.message);
        }
    }
}
