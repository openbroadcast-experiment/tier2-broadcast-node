// config.ts prepares the global config object
// The global config object is loaded with envvars and contains signing info, DID details, and database connection info
import {ethers} from "ethers";
import dotenv from 'dotenv';

dotenv.config();
export type Config = {
    privateKey: string; // Your ethereum wallet private key, must be provided for the application to start
    publicKey: string; // Your ethereum wallet address
    did: string; // Your DID, which will be generated as "did:pkh:eip155:1:<your-address>"
    wallet: ethers.Wallet; // Convenience property, ether wallet loaded with your private key ready to use
    powChallenge: string; // Should contain the suffix the must be present in a submitted PoW hash. If unsure, pass "0000"
    tier1Endpoint: string; // For the hackathon submission, there's only one Tier 1 node
    databaseUrl: string; // The URL of the database to connect to
}

const requireVarSet = (envvar: string) => {
    const v = process.env[envvar];
    if (!v) {
        throw new Error(`Missing required environment variable ${envvar}`);
    }
    return v
}

const wallet = new ethers.Wallet(requireVarSet("PRIVATE_KEY"))

// Load + validate the TIER1_ENDPOINT envvar
const tier1Endpoint = requireVarSet("TIER1_ENDPOINT")
if (!tier1Endpoint.startsWith("http")) {
    throw new Error(`TIER1_ENDPOINT must start with http or https, got ${tier1Endpoint}`)
}

// If the user MUST submit an envvar, use requireVarSet, which will throw an error if the envvar is empty or missing
// If the user can optionally submit an envvar, use process.env["ENVVAR"] || "default value"
// Generated values, like did, wallet, and publicKey, can be assigned directly to object properties
// All config below MUST have been validated before being assigned (see tier1 endpoint for example).
// You can do validations in the code leading up to this config object declaration
export const config: Config = {
    privateKey: requireVarSet("PRIVATE_KEY"),
    publicKey: wallet.address,
    did: "did:pkh:eip155:1:" + wallet.address,
    wallet: new ethers.Wallet(requireVarSet("PRIVATE_KEY")),
    powChallenge: process.env.POW_CHALLENGE || "0000",
    tier1Endpoint: tier1Endpoint,
    databaseUrl: requireVarSet("DATABASE_URL"),
}

console.log("finished loading config", config)