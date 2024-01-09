// config.ts prepares the global config object
// The global config object is loaded with envvars and contains signing info, DID details, and database connection info
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import * as didJWT from 'did-jwt';
import { peerIdFromKeys } from '@libp2p/peer-id';
import { keys } from '@libp2p/crypto';
import { PrivateKey, PublicKey } from '@libp2p/interface';

dotenv.config();


// If the user MUST submit an envvar, use requireVarSet, which will throw an error if the envvar is empty or missing
// If the user can optionally submit an envvar, use process.env["ENVVAR"] || "default value"
// Generated values, like did, wallet, and publicKey, can be assigned directly to object properties
// All config below MUST have been validated before being assigned (see tier1 endpoint for example).
// You can do validations in the code leading up to this config object declaration
export type Config = {
  port: number; // The port to run the server on
  host: string; // The host to run the server on
  ethereumPrivateKey: string; // Your ethereum wallet private key, must be provided for the application to start
  ethereumPublicKey: string; // Your ethereum wallet address
  wallet: ethers.Wallet; // Convenience property, ether wallet loaded with your private key ready to use
  did: string; // Your DID, which will be generated as "did:pkh:eip155:1:<your-address>"
  myTopic: string; // The topic this node publishes messages to
  powChallenge: string; // Should contain the suffix the must be present in a submitted PoW hash. If unsure, pass "0000"
  databaseUrl: string; // The URL of the database to connect to
  redisUrl: string; // The URL of the redis instance to connect to
  redisPort: number; // The port of the redis instance to connect to
  didJwtSigner: didJWT.Signer; // The signer used to sign JWTs
  libp2pPort: number; // The port to run libp2p on
  libp2pHost: string; // The host to run libp2p on
  libp2pPeerId: any; // The peerId of the node
  libp2pPublicKey: PublicKey;
  libp2pPrivateKey: PrivateKey;
  subscribedTopics: { [key: string]: {} }; // The topics this node subscribes to
  fullStorage: boolean; // If true, the node will store message data in the database
  debugMode: boolean;
}


const requireVarSet = (envvar: string) => {
  const v = process.env[envvar];
  if (!v) {
    throw new Error(`Missing required environment variable ${envvar}`);
  }
  return v;
};
const swapPlaceholders = (source: string, replacements: {[key: string]: string}) => {
  let result = source;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(key, value);
  }
  return result;
}

// function buf2hex(buffer: Uint8Array) { // buffer is an ArrayBuffer
//   return [...buffer]
//     .map(x => x.toString(16).padStart(2, '0'))
//     .join('');
// }

//Load ether private key early because we use it in multiple config elements
const etherPrivateKey = requireVarSet('PRIVATE_KEY');
const wallet = new ethers.Wallet(etherPrivateKey);
const myDid = 'did:pkh:eip155:1:' + wallet.address
const myTopic = swapPlaceholders(requireVarSet('MY_TOPIC'), {
  '<USER_DID>': myDid,
  '<USER_ETHEREUM_PUBKEY>': wallet.address,
})
const subscribedTopics = (process.env.SUBSCRIBED_TOPICS || "").split(',').reduce((acc, topic) => {
  acc[topic] = {};
  return acc;
}, {} as typeof config.subscribedTopics)
// Node host is always subscribed to their own topic

console.log("subscribedTopics: ", subscribedTopics)

const peerIdPriv = Buffer.from(requireVarSet('LIBP2P_PRIVATE_KEY'), 'base64');
const peerIdPub = Buffer.from(requireVarSet('LIBP2P_PUBLIC_KEY'), 'base64');



export const config: Config = {
  ethereumPrivateKey: etherPrivateKey,
  ethereumPublicKey: wallet.address,
  did: myDid,
  myTopic,
  databaseUrl: requireVarSet('DATABASE_URL'),
  didJwtSigner: didJWT.ES256KSigner(didJWT.hexToBytes(etherPrivateKey)),
  redisUrl: process.env.REDIS_URL || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT) || 6379,
  subscribedTopics,
  wallet: new ethers.Wallet(requireVarSet('PRIVATE_KEY')),
  powChallenge: process.env.POW_CHALLENGE || '0000',
  port: parseInt(process.argv[2]) || parseInt(process.env.REST_API_PORT) || 8080,
  host: process.env.HOST || '0.0.0.0',
  libp2pPort: parseInt(process.argv[3]) || parseInt(process.env.LIBP2P_PORT) || 4002,
  libp2pHost: process.env.LIBP2P_HOST || '0.0.0.0',
  libp2pPeerId: await peerIdFromKeys(peerIdPub, peerIdPriv),
  libp2pPublicKey: keys.unmarshalPublicKey(peerIdPub),
  libp2pPrivateKey:  await keys.unmarshalPrivateKey(peerIdPriv),
  fullStorage: process.env.FULL_STORAGE === 'true',
  debugMode: process.env.DEBUGMODE === 'true',
};

