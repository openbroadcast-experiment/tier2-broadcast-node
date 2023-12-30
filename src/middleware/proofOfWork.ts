import {FastifyReply, FastifyRequest} from "fastify";
import {Static, Type} from "@sinclair/typebox";
import {argon2Verify} from "hash-wasm";
import {config} from "../config.js";

export const ProofOfWorkHeaders = Type.Object({
    "X-Proof-Of-Work": Type.String(),
    "X-Client-DID": Type.String(),
})
export type ProofOfWorkHeadersType = Static<typeof ProofOfWorkHeaders>

class HeaderHasArrayValueError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "HeaderHasArrayValueError";
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, HeaderHasArrayValueError);
        }
    }
}

export function disallowArrayHeaders(headers: Record<string, string | string[]>): Record<string, string> {
    const ret: Record<string, string> = {}
    for (const headerKey in headers) {
        const header = headers[headerKey]
        if (Array.isArray(header)) {
            throw new HeaderHasArrayValueError(`You passed the same authorization header more than once: ${headerKey}`)
        }
        ret[headerKey] = header
    }
    return ret
}

// This spam protection middleware requires the user to submit a solved proof of work challenge to access an underlying route
export const requireProofOfWork = async (request: FastifyRequest, reply: FastifyReply, done: Function) => {
    try {
        const headers = disallowArrayHeaders(request.headers) as ProofOfWorkHeadersType
        const clientDid = headers["X-Client-DID"];
        const challengeHash = headers["X-Proof-Of-Work"];

        // Check that user submitted all required headers
        if (!clientDid || !challengeHash) {
            return reply.status(400).send(`You are missing a required header`);
        }

        const lastPart = challengeHash.substring(challengeHash.lastIndexOf('$') + 1, challengeHash.length);
        const answerHex = Buffer.from(lastPart, 'base64').toString('hex');

        const proofOfWorkChallenge = new RegExp(config.powChallenge, "g")
        if (answerHex.match(proofOfWorkChallenge).length == 0) {
            return reply.status(400).send(`User submitted invalid challenge hash, should end with ${config.powChallenge}`)
        }
        const isVerified = await argon2Verify({
            password: `${config.did}${clientDid}`,
            hash: challengeHash,
        });

        if (!isVerified) {
            return reply.status(401).send("Failed to verify hash");
        }
    } catch (e: any) {
        if (e instanceof HeaderHasArrayValueError) {
            return reply.status(400).send(e.message);
        } else {
            return reply.status(500).send(e.message);
        }
    }
    done();
}
