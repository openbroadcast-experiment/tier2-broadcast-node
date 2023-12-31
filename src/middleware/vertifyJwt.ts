import {Resolver} from "did-resolver";
import {getResolver as pkhDidResolver} from "pkh-did-resolver";
import * as didJWT from 'did-jwt';
import {config} from "../config.js";
import {FastifyReply, FastifyRequest} from "fastify";
import {Static, Type} from "@sinclair/typebox";
import {disallowArrayHeaders, HeaderHasArrayValueError} from "./lib.js";

let resolver = new Resolver({...pkhDidResolver()});

export const JwtVerifyHeaders = Type.Object({
    "authorization": Type.String(),
    "x-user-did": Type.String(),
})
export type JwtVerifyHeadersType = Static<typeof JwtVerifyHeaders>

// This spam protection middleware requires the user to submit a solved proof of work challenge to access an underlying route
// It requires the user to submit a valid JWT through the Authorization header
export const verifySelfSignedJwt = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        console.log("Verifying the user's JWT")
        const headers = disallowArrayHeaders(request.headers) as JwtVerifyHeadersType
        const clientJwt = headers["authorization"];
        console.log("clientJwt", clientJwt)
        // Check that user submitted all required headers
        if (!clientJwt) {
            return reply.status(400).send(`You are missing a required header: "Authorization"`);
        }
        const clientDid = headers["x-user-did"];
        if (!clientDid) {
            return reply.status(400).send(`You are missing a required header: "X-uqser-DID"`);
        }

        request.jwt = clientJwt;

        //verify the JWT
        const isVerified = (await didJWT.verifyJWT(clientJwt, {
            resolver,
            audience: clientDid
        })).verified;

        if (!isVerified) {
            return reply.status(401).send("Failed to verify jwt");
        }

    } catch (e: any) {
        if (e instanceof HeaderHasArrayValueError) {
            return reply.status(400).send(e.message);
        } else {
            return reply.status(500).send(`Failed to verify JWT: ${e.message}`);
        }
    }
}
