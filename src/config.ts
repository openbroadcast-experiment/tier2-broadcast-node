// config.ts prepares the global config object
// The global config object is loaded with envvars and contains signing info, DID details, and database connection info
import {ethers} from "ethers";

export type Config = {
    privateKey: string;
    publicKey: string;
    did: string;
    wallet: ethers.Wallet;
    powChallenge: string;
}

const requireVarSet = (envvar: string) => {
    const v = process.env[envvar];
    if (!v) {
        throw new Error(`Missing required environment variable ${envvar}`);
    }
    return v
}

const wallet = new ethers.Wallet(requireVarSet("PRIVATE_KEY"))

export const config: Config =  {
    privateKey: requireVarSet("PRIVATE_KEY"),
    publicKey: wallet.address,
    did: "did:pkh:eip155:1:" + wallet.address,
    wallet: new ethers.Wallet(requireVarSet("PRIVATE_KEY")),
    powChallenge: "POW_CHALLENGE" || "0000",
}
