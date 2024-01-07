import {Resolver} from "did-resolver";
import {getResolver as pkhDidResolver} from "pkh-did-resolver";
import * as didJWT from 'did-jwt';
import {config} from "../config.js";
import {FastifyReply, FastifyRequest} from "fastify";
import {Static, Type} from "@sinclair/typebox";
import {disallowArrayHeaders, HeaderHasArrayValueError} from "./lib.js";

import * as dag_json  from '@ipld/dag-json'
import { CID } from "multiformats";
import { sha256 } from 'multiformats/hashes/sha2' 
import * as multiformats_json from 'multiformats/codecs/json'
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
        const authorization = headers["authorization"];
        //TODO in the future we should stop assumeing payload is JSON and check the content-type
        console.log("clientJwt", authorization)
        // Check that user submitted all required headers
        if (!authorization) {
            return reply.status(400).send(`You are missing a required header: "Authorization"`);
        }
        const clientDid = headers["x-user-did"]; //This is redundant information the JWT has userDid in it 
        if (!clientDid) {
            return reply.status(400).send(`You are missing a required header: "x-user-did"`);
        }

        request.jwt = authorization;

        const data = request.body //assuming json
        if(data !== undefined && data !== null) {
            if( typeof data !== 'object') {
                return reply.status(401).send("Failed becuase body is not json");
            }

            if(config.debugMode)
            console.log("🚀 ~ file: verifyJwt.ts:48 ~ verifySelfSignedJwt ~ data:", JSON.stringify(data))
            const bytes = dag_json.encode(data) 
            /*
    [
        94, 134, 210, 102, 128, 111, 104,
        125, 236, 160, 207, 235, 116, 117,
        142, 122, 110, 150,  23,  79,  22,
        99,  96,  81, 228,   8, 118, 185,
        57, 156, 135, 206
    ]
            */
            const hash = await sha256.digest(bytes)
            //console.log("🚀 ~ file: verifyJwt.ts:51 ~ verifySelfSignedJwt ~ hash:", hash)
            const cid = CID.create(1, 0x0129, hash).toString()
            
            if(config.debugMode){
                console.log("🚀 ~ file: verifyJwt.ts:50 ~ verifySelfSignedJwt ~ cid:", cid)
                //console.log(" for user  payloadsig should be ")
            }
            const decoded_auth_jwt = didJWT.decodeJWT(authorization);
            if(config.debugMode)
            console.log("🚀 ~ file: verifyJwt.ts:53 ~ verifySelfSignedJwt ~ decoded_auth_jwt:", decoded_auth_jwt)
            if(!decoded_auth_jwt.payload.payload_cid)
            return reply.status(401).send("payload_cid missing in jwt");

            if(decoded_auth_jwt.payload.payload_cid !== cid){
                return reply.status(401).send("Failed to verify jwt becuase jwt.payload.payload_cid  does not match our calcualted cid");
            }

    }

        //verify the JWT
        const isVerified = (await didJWT.verifyJWT(authorization, {
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
