// This is where the libp2p node is created and configured.
// It is started in the main index file
import { createLibp2p } from 'libp2p';
import { config } from '../config.js';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { plaintext } from '@libp2p/plaintext';
import { mplex } from '@libp2p/mplex';
import { gossipsub, GossipsubEvents } from '@chainsafe/libp2p-gossipsub';
import { ping, PingService } from '@libp2p/ping';
import { mdns } from '@libp2p/mdns';
import { eventHistory, transmissionHistory } from './history.js';
import { KadDHT, kadDHT } from '@libp2p/kad-dht';
import { Identify, identify } from '@libp2p/identify';
import { dcutr } from '@libp2p/dcutr';
import type {PubSub} from '@libp2p/interface';


const libp2pNode = await createLibp2p<{
  pubsub: PubSub<GossipsubEvents>,
  ping: PingService,
  dht: KadDHT,
  identify: Identify,
  dcutr: any
}>({
  // peerId: config.libp2pPeerId,
  addresses: {
    listen: [`/ip4/${config.libp2pHost}/tcp/${config.libp2pPort}`],
  },
  transports: [tcp()],
  connectionEncryption: [noise(), plaintext()],
  streamMuxers: [mplex()],
  // connectionManager:{
  //   dial: true,
  // },
  services: {
    pubsub: gossipsub({
      // allowPublishToZeroPeers: true,
      // emitSelf: true,
      // allowedTopics: [config.tier1Did],
      // directPeers: [{
      //     id: peerIdFromString(multiaddr(config.tier1Endpoint).getPeerId()),
      //     addrs: [multiaddr(config.tier1Endpoint)]
      // }]
      emitSelf: true,
      allowPublishToZeroPeers: true,
      awaitRpcMessageHandler: true,
    }),
    ping: ping({
      protocolPrefix: 'ipfs', // default
    }),
    dht: kadDHT({}),
    identify: identify(),
    dcutr: dcutr()
  },
  peerDiscovery: [mdns()],
});



libp2pNode.services.pubsub.addEventListener('message', (message) => {
  //TODO If we can make the peer id predictable, we don't need to check the topic for the DID
  eventHistory.push({ eventType: 'message', data: JSON.stringify(message.detail) })
  const decoded = new TextDecoder().decode(message.detail.data);
  ;
  try {
    // const json: any = JSON.parse(decoded);
    // const { did, jwt, body } = json;
    // if (!did || !jwt || !body) {
    //   console.log('message body was missing a required property (\'did\',\'jwt\',\'body\') ignoring');
    //   transmissionHistory.push({
    //     data: message,
    //     outcome: 'SKIPPED',
    //     error: 'message body was missing a required property (\'did\',\'jwt\',\'body\')',
    //   });
    //   return;
    // }
    // if (did !== config.tier1Did) {
    //   console.log(`received message from someone other than tier1 (${did}), ignoring`);
    //   transmissionHistory.push({
    //     data: message,
    //     outcome: 'SKIPPED',
    //     error: `received message from someone other than tier1 (${did}), ignoring`,
    //   });
    //   return;
    // }
    console.log(`successfully processed message`, message, message.detail);
    transmissionHistory.push({ data: decoded, outcome: 'SUCCESS', error: undefined });
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.log('received a message that is not json, ignoring');
      transmissionHistory.push({
        data: message,
        outcome: 'SKIPPED',
        error: 'received a message that is not json, ignoring',
      });
    } else {
      console.error('Encountered error processing message through gossipsub', e);
      transmissionHistory.push({ data:decoded, outcome: 'FAILED', error: e });
    }
  }
});
libp2pNode.services.pubsub.addEventListener('gossipsub:message', (message) => {
  console.log('gossipsub:message:', message.detail);
  eventHistory.push({ eventType: 'gossipsub:message', data: message.detail });
});

libp2pNode.services.pubsub.addEventListener('subscription-change', (message) => {
  console.log('subscription-change:', message.detail);
  eventHistory.push({ eventType: 'subscription-change', data: message.detail });
});

libp2pNode.addEventListener('peer:discovery', async (evt) => {
  console.log('Discovered...', evt.detail); // Log
  // await libp2pNode.dial(evt.detail.multiaddrs)
  for(const addr of evt.detail.multiaddrs){
    try {
      if(addr.toString().includes("127.0.0.1")){
        console.log("Attempting to connect to  " + addr)
        await libp2pNode.dial(addr)
        break
      }
    } catch (e) {
      console.log("Failed to connect to peer:" + e)
    }
  }
  eventHistory.push({ eventType: 'peer:discovery', data: evt.detail });

  // discovered peer
});

libp2pNode.addEventListener('peer:connect', (evt) => {
  console.log('peer:connect %s', evt.detail); // Log connected peer
  // libp2pNode.services.pubsub.
  // libp2pNode.services.pubsub.addEventListener()
  eventHistory.push({ eventType: 'peer:connect', data: evt.detail });
  // libp2pNode.services.pubsub.subscribe("demo-topic");
  // for()
  // libp2pNode.dial(evt.detail);
});

libp2pNode.services.pubsub.subscribe("demo-topic");

// await node.dial(multiaddr(config.tier1Endpoint))
// libp2pNode.services.pubsub.subscribe(config.tier1Did);
// libp2pNode.services.pubsub.subscribe('demo-topic');

// console.log(libp2pNode.services.pubsub.getTopics());
// console.log(libp2pNode.services.pubsub.getPeers());
// console.log(libp2pNode.services.pubsub.getSubscribers(config.tier1Did));
// node.services.pubsub.publish('fruit', new TextEncoder().encode(JSON.stringify({
//     did: config.tier1Did,
//     jwt: "test",
//     body: "banana"
// })))

// print out listening addresses
await libp2pNode.start();


export { libp2pNode };