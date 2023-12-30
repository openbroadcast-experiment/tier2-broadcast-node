

//TODO This does not belong in the backend code and needs to be removed.
// I added it here just so I don't have to go to the front end to get the PoW solution

import {Buffer} from "node:buffer";
import {argon2id} from "hash-wasm";


const validatorDid = "did:pkh:eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
const userDid = "did:pkh:eip155:1:0x14dC79964da2C08b23698B3D3cc7Ca32193d9955"
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

            console.log("🚀 ~ file: do Proof OF work  success after iteration:", iteration)
            return { answerHash };
        }
        iteration++;
    } while (Date.now() - startTime < 500000);

    throw new Error('Time Out ~ proofOfWork ~ ');
};

const solution = await doProofOfWork()
console.log("solution", solution)
process.exit(0)