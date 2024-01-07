// config.ts prepares the global config object
// The global config object is loaded with envvars and contains signing info, DID details, and database connection info
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import * as didJWT from 'did-jwt';
import { peerIdFromKeys } from '@libp2p/peer-id';
import { keys } from '@libp2p/crypto';

dotenv.config();
export type Config = {
  privateKey: string; // Your ethereum wallet private key, must be provided for the application to start
  publicKey: string; // Your ethereum wallet address
  did: string; // Your DID, which will be generated as "did:pkh:eip155:1:<your-address>"
  myTopic: string; // The topic this node publishes messages to
  redisUrl: string; // The URL of the redis instance to connect to
  redisPort: number; // The port of the redis instance to connect to
  // wallet: ethers.Wallet; // Convenience property, ether wallet loaded with your private key ready to use
  powChallenge: string; // Should contain the suffix the must be present in a submitted PoW hash. If unsure, pass "0000"
  // tier1Endpoint: string; // For the hackathon submission, there's only one Tier 1 node
  // tier1Did: string; // The DID of the Tier 1 node
  databaseUrl: string; // The URL of the database to connect to
  didJwtSigner: didJWT.Signer; // The signer used to sign JWTs
  port: number; // The port to run the server on
  host: string; // The host to run the server on
  libp2pPort: number; // The port to run libp2p on
  libp2pHost: string; // The host to run libp2p on
  libp2pPeerId: any; // The peerId of the node
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


function buf2hex(buffer: Uint8Array) { // buffer is an ArrayBuffer
  return [...buffer]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

//Load ether private key early because we use it in multiple config elements
const etherPrivateKey = requireVarSet('PRIVATE_KEY');
const wallet = new ethers.Wallet(etherPrivateKey);
const getPeerIdFromEthersPrivateKey = async (privateKey: string) => {
  // const privateKeyBuffer = Buffer.from(wallet.signingKey.privateKey.replace('0x', ''), 'hex');
  // const publicKeyBuffer = Buffer.from(wallet.signingKey.publicKey.replace('0x', ''), 'hex');
  // const libp2pPrivateKey = marshalPrivateKey({ bytes: privateKeyBuffer }, 'secp256k1');
  // const libp2pPublicKey = marshalPublicKey({ bytes: publicKeyBuffer }, 'secp256k1');

  // const genKeys = await keys.generateKeyPair('secp256k1');
  //
  // const peerId = await peerIdFromKeys(genKeys.public.bytes, genKeys.bytes);
  // console.log('public key: ', buf2hex(genKeys.public.bytes));
  // console.log('priv key: ', buf2hex(genKeys.bytes));
  // console.log('private key: ', genKeys.bytes);
  // console.log('generated peerId: ', peerId);

  // return await peerIdFromKeys(genKeys.public.bytes, genKeys.bytes);
  // return await peerIdFromKeys(libp2pPublicKey, libp2pPrivateKey);
  // const elem = {
  //   id: '16Uiu2HAkxUuQPdJ1bqZ3MiF3onkLmReapDgdENBgREzkuQbWhgLr',
  //     privKey: 'CAISIGfqjWbopTq5/0qwnzRI3rpWpQzvNGxgs2MCHyhOZmZT',
  //   pubKey: 'CAISIQItZvtcRbkVNMwWLBjgoxNFm7DImzdMw1o6kp+ApD6gCw=='
  // }

};


// console.log("loaded peerId from config: ", peerIdFromKeys(wallet.address, wallet.privateKey))
// console.log("loaded peerId from config: ", peerIdFromString(etherPrivateKey))
const subscribedTopics = (process.env.SUBSCRIBED_TOPICS || "").split(',').reduce((acc, topic) => {
  acc[topic] = {};
  return acc;
}, {} as typeof config.subscribedTopics)
console.log("subscribedTopics: ", subscribedTopics)
// If the user MUST submit an envvar, use requireVarSet, which will throw an error if the envvar is empty or missing
// If the user can optionally submit an envvar, use process.env["ENVVAR"] || "default value"
// Generated values, like did, wallet, and publicKey, can be assigned directly to object properties
// All config below MUST have been validated before being assigned (see tier1 endpoint for example).
// You can do validations in the code leading up to this config object declaration
console.log('wallet signer private: ', wallet.signingKey.privateKey);
console.log('wallet signer public: ', wallet.signingKey.publicKey);
const genKeys = await keys.generateKeyPair('secp256k1');
const peerIdPriv = Buffer.from(requireVarSet('LIBP2P_PRIVATE_KEY'), 'base64');
const peerIdPub = Buffer.from(requireVarSet('LIBP2P_PUBLIC_KEY'), 'base64');

export const config: Config = {
  privateKey: etherPrivateKey,
  publicKey: wallet.address,
  did: 'did:pkh:eip155:1:' + wallet.address,
  myTopic: requireVarSet('MY_TOPIC'),
  databaseUrl: requireVarSet('DATABASE_URL'),
  didJwtSigner: didJWT.ES256KSigner(didJWT.hexToBytes(etherPrivateKey)),
  redisUrl: process.env.REDIS_URL || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT) || 6379,
  subscribedTopics,
  // wallet: new ethers.Wallet(requireVarSet('PRIVATE_KEY')),
  powChallenge: process.env.POW_CHALLENGE || '0000',
  port: parseInt(process.argv[2]) || parseInt(process.env.REST_API_PORT) || 8080,
  host: process.env.HOST || '0.0.0.0',
  libp2pPort: parseInt(process.argv[3]) || parseInt(process.env.LIBP2P_PORT) || 4002,
  libp2pHost: process.env.LIBP2P_HOST || '0.0.0.0',
  libp2pPeerId: await peerIdFromKeys(peerIdPub, peerIdPriv),
  fullStorage: process.env.FULL_STORAGE === 'true',
  debugMode: process.env.DEBUGMODE === 'true',
};
console.log(await getPeerIdFromEthersPrivateKey(etherPrivateKey));
console.log('finished loading config', config);

