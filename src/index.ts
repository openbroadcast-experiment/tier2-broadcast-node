import cors from '@fastify/cors';
import fastify from 'fastify';
import getChallengeRoute from "./routes/getChallenge.js";
import {PrismaClient} from '@prisma/client'
import {publishRoute} from "./routes/publish.js";
import {TypeBoxTypeProvider} from "@fastify/type-provider-typebox";
import { config } from './config.js'; //Generate this with `npx prisma generate`
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'
import { ping } from '@libp2p/ping';
import { plaintext } from '@libp2p/plaintext';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import {mdns} from "@libp2p/mdns"
import { createSecp256k1PeerId } from '@libp2p/peer-id-factory';
import PeerId from "peer-id";
export const prisma = new PrismaClient()


// Start REST API server
const server = fastify({
    logger: true
}).withTypeProvider<TypeBoxTypeProvider>();
server.register(cors, {
    origin: '*',
});

server.register(getChallengeRoute); // /getChallenge
server.register(publishRoute); // /publish
server.listen(
    {
        port: config.port,
        host: config.host,
    },
    (err, address) => {
        if (err) {
            console.error(err);
            process.exit(1);
        }
        console.log(`Server listening at ${address}`);
    },
);

const peerId =  await createSecp256k1PeerId()
console.log("peerId", peerId)
console.log("peerId", peerId.toString())

const peerId2 = await PeerId.create({keyType: 'secp256k1'})
console.log("peerId2", peerId2.toJSON())

console.log("peerId mh", peerId.multihash)
const libp2pNode = await createLibp2p({
    peerId: config.libp2pPeerId,
    addresses: {
        listen: [`/ip4/${config.libp2pHost}/tcp/${config.libp2pPort}`]
    },
    transports: [tcp()],
    connectionEncryption: [noise(), plaintext()],
    streamMuxers: [mplex()],
    services: {
        pubsub: gossipsub({
            // allowPublishToZeroPeers: true,
            emitSelf: true,
            allowedTopics: [config.tier1Did],
            // directPeers: [{
            //     id: peerIdFromString(multiaddr(config.tier1Endpoint).getPeerId()),
            //     addrs: [multiaddr(config.tier1Endpoint)]
            // }]
        }),
        ping: ping({
            protocolPrefix: 'ipfs', // default
        }),
    },
    peerDiscovery: [mdns()]
})

libp2pNode.services.pubsub.addEventListener('message', (message) => {
    //TODO If we can make the peer id predictable, we don't need to check the topic for the DID
    console.log("received message, raw:", message)
    console.log("detail", message.detail)

    const decoded = new TextDecoder().decode(message.detail.data)
    try {
        const json: any = JSON.parse(decoded)
        const {did, jwt, body} = json
        if (!did || !jwt || !body) {
            console.log("message body was missing a required property ('did','jwt','body') ignoring")
            return
        }
        if (did !== config.tier1Did) {
            console.log(`received message from someone other than tier1 (${did}), ignoring`)
            return
        }

    } catch (e) {
        if (e instanceof SyntaxError) {
            console.log("received a message that is not json, ignoring", decoded)
        } else {
            console.error("Encountered error processing message through gossipsub", e)
        }
    }
})

libp2pNode.services.pubsub.addEventListener('subscription-change', (message) => {
    console.log('subscription-change:', message);
})

libp2pNode.addEventListener('peer:discovery', (evt) => {
    console.log('Discovered...', evt.detail) // Log
    // discovered peer
})

libp2pNode.addEventListener('peer:connect', (evt) => {
    console.log('Connected to %s', evt.detail) // Log connected peer
    console.log(libp2pNode.services.pubsub.getPeers())
    console.log(libp2pNode.services.pubsub.getTopics())
    console.log(libp2pNode.services.pubsub.getSubscribers(config.tier1Did))
})

await libp2pNode.start()
// await libp2pNode.dial(multiaddr(config.tier1Endpoint))
libp2pNode.services.pubsub.subscribe(config.tier1Did)
console.log(libp2pNode.services.pubsub.getTopics())
console.log(libp2pNode.services.pubsub.getPeers())
console.log(libp2pNode.services.pubsub.getSubscribers(config.tier1Did))
// libp2pNode.services.pubsub.publish('fruit', new TextEncoder().encode(JSON.stringify({
//     did: config.tier1Did,
//     jwt: "test",
//     body: "banana"
// })))

// print out listening addresses

console.log('libp2p listening on addresses:')
libp2pNode.getMultiaddrs().forEach((addr) => {
    console.log(addr?.toString())
})



const listeners = ['SIGINT', 'SIGTERM'];
listeners.forEach((signal) => {
    process.on(signal, async () => {
        await server.close();
        await libp2pNode.stop();
        process.exit(0);
    });
});





