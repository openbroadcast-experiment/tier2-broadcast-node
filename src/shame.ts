import * as didJWT from 'did-jwt'; //NEW WINNER  didJWT.ES256KSigner(didJWT.hexToBytes(debug_parent_privatekey))
//TODO This does not belong in the backend code and needs to be removed.
// I added it here just so I don't have to go to the front end to get the PoW solution
// This file generates a valid PoW solution and a valid JWT that can be used in insomnia
import { Buffer } from 'node:buffer';
import { argon2id } from 'hash-wasm';
import { config } from './config.js';
import PeerId from 'peer-id';
import * as dag_json from '@ipld/dag-json';
import { CID } from 'multiformats';
import { sha256 } from 'multiformats/hashes/sha2';


const validatorDid = 'did:pkh:eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const userDid = 'did:pkh:eip155:1:0x14dC79964da2C08b23698B3D3cc7Ca32193d9955';
const payload_empty = JSON.parse(`{}`);
const payload = JSON.parse(`{"topic":"did:pkh:eip155:1:0x90F79bf6EB2c4f870365E785982E1f101E93b906","data":{"a":1}}`);
console.log('🚀 ~ file: shame.ts:21 ~ payload:', payload);


const bytes = dag_json.encode(payload);
const hash = await sha256.digest(bytes);
console.log('🚀 ~ file: shame.ts:29 ~ hash:', hash);

const cid = CID.create(1, 0x0129, hash).toString();
console.log('🚀 ~ file: shame.ts:29 ~ cid:', cid); // baguqeeranwatcquzgfpcqfonotq3rhku24sv6zs4m2y6ebdygm54dkvnrpsq


const bytes_empty = dag_json.encode(payload_empty);
const hash_empty = await sha256.digest(bytes_empty);
console.log('🚀 ~ file: shame.ts:51 ~ hash_empty:', hash_empty);
const cid_empty = CID.create(1, 0x0129, hash).toString();
console.log('🚀 ~ file: shame.ts:52 ~ cid_empty:', cid_empty);


export const doProofOfWork = async (): Promise<{ answerHash: string }> => {
  const randomHexString = () => {
    let size = Math.floor(Math.random() * Math.floor(500));
    size = size >= 16 ? size : 16;
    const randomString = [...Array(size)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
    return Buffer.from(randomString).toString('hex');
  };

  let answerHash = '';

  const startTime = Date.now();
  let iteration = 0;
  do {
    answerHash = await argon2id({
      password: validatorDid + userDid,
      salt: randomHexString(),
      parallelism: 2,
      iterations: 1,
      memorySize: 1000,
      hashLength: 32, // output size = 32 bytes
      outputType: 'encoded',
    });

    const lastPart = answerHash.substring(answerHash.lastIndexOf('$') + 1, answerHash.length);

    const answerHex = Buffer.from(lastPart, 'base64').toString('hex');

    if ((answerHex.match(/0000/g) || []).length > 0) {

      console.log('🚀 ~ file: do Proof OF work  success after iteration:', iteration);
      return { answerHash };
    }
    iteration++;
  } while (Date.now() - startTime < 500000);

  throw new Error('Time Out ~ proofOfWork ~ ');
};

const generateJWT = async () => {
  const userDID = process.env.USER_DID;
  if (!userDID) {
    throw new Error('USER_DID env variable not set, cant create jwt');
  }
  let jwt = await didJWT.createJWT(
    { aud: userDid, iat: undefined, name: 'example parent forever access jwt', latency_time_stamp_check: Date.now() },
    { issuer: config.did, signer: config.didJwtSigner },
    { alg: 'ES256K' });
  return jwt;
};


const generatePayloadJWT = async () => {
  const userDID = process.env.USER_DID;
  if (!userDID) {
    throw new Error('USER_DID env variable not set, cant create jwt');
  }
  let jwt = await didJWT.createJWT(
    { aud: userDid, iat: parseInt(new Date().toISOString()), name: 'payload-sig', payload_cid: cid },
    { issuer: config.did, signer: config.didJwtSigner },
    { alg: 'ES256K' });
  return jwt;
};

const payloadjwt = await generatePayloadJWT();
console.log('🚀 ~ file: shame.ts:93 ~ payloadjwt:', payloadjwt);
const solution = await doProofOfWork();
const jwt = await generateJWT();

const generatePrivateKey = await PeerId.create({ keyType: 'secp256k1' });
console.log('generated libp2p private key', generatePrivateKey.toJSON());
console.log('solution', solution);
console.log('jwt', jwt);
process.exit(0);