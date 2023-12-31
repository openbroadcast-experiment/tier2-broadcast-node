// This is where the libp2p node is created and configured.
// It is started in the main index file
import { createLibp2p, Libp2p } from 'libp2p';
import { config } from '../config.js';
import { tcp } from '@libp2p/tcp';
import { noise } from '@chainsafe/libp2p-noise';
import { plaintext } from '@libp2p/plaintext';
import { mplex } from '@libp2p/mplex';
import { gossipsub, GossipsubEvents } from '@chainsafe/libp2p-gossipsub';
import { ping, PingService } from '@libp2p/ping';
import { mdns } from '@libp2p/mdns';
import { PubSub } from '@libp2p/interface';
import { eventHistory, transmissionHistory } from './history.js';


const libp2pNode: Libp2p<{ pubsub: PubSub<GossipsubEvents>, ping: PingService }> = await createLibp2p({
  peerId: config.libp2pPeerId,
  addresses: {
    listen: [`/ip4/${config.libp2pHost}/tcp/${config.libp2pPort}`],
  },
  transports: [tcp()],
  connectionEncryption: [noise(), plaintext()],
  streamMuxers: [mplex()],
  services: {
    pubsub: gossipsub({
      // allowPublishToZeroPeers: true,
      emitSelf: true,
      // allowedTopics: [config.tier1Did],
      // directPeers: [{
      //     id: peerIdFromString(multiaddr(config.tier1Endpoint).getPeerId()),
      //     addrs: [multiaddr(config.tier1Endpoint)]
      // }]
    }),
    ping: ping({
      protocolPrefix: 'ipfs', // default
    }),
  },
  peerDiscovery: [mdns()],
});

libp2pNode.services.pubsub.addEventListener('message', (message) => {
  //TODO If we can make the peer id predictable, we don't need to check the topic for the DID
  eventHistory.push({eventType: "message", data: message});
  try {
    const decoded = new TextDecoder().decode(message.detail.data);
    const json: any = JSON.parse(decoded);
    const { did, jwt, body } = json;
    if (!did || !jwt || !body) {
      console.log('message body was missing a required property (\'did\',\'jwt\',\'body\') ignoring');
      transmissionHistory.push({data: message, outcome: "SKIPPED", error: "message body was missing a required property (\'did\',\'jwt\',\'body\')" });
      return;
    }
    if (did !== config.tier1Did) {
      console.log(`received message from someone other than tier1 (${did}), ignoring`);
      transmissionHistory.push({data: message, outcome: "SKIPPED", error: `received message from someone other than tier1 (${did}), ignoring` });
      return;
    }
    console.log(`successfully processed message`, message, message.detail);
    transmissionHistory.push({data: message, outcome: "SUCCESS", error: undefined });
  } catch (e) {
    if (e instanceof SyntaxError) {
      console.log('received a message that is not json, ignoring');
      transmissionHistory.push({data: message, outcome: "SKIPPED", error: "received a message that is not json, ignoring" });
    } else {
      console.error('Encountered error processing message through gossipsub', e);
      transmissionHistory.push({data: message, outcome: "FAILED", error: e });
    }
  }
});

libp2pNode.services.pubsub.addEventListener('subscription-change', (message) => {
  console.log('subscription-change:', message);
  eventHistory.push({eventType: "subscription-change", data: message});
});

libp2pNode.addEventListener('peer:discovery', (evt) => {
  console.log('Discovered...', evt.detail); // Log
  eventHistory.push({eventType: "peer:discovery", data: evt});
  // discovered peer
});

libp2pNode.addEventListener('peer:connect', (evt) => {
  console.log('peer:connect %s', evt.detail); // Log connected peer
  eventHistory.push({eventType: "peer:connect", data: evt});
});

// await node.dial(multiaddr(config.tier1Endpoint))
libp2pNode.services.pubsub.subscribe(config.tier1Did);

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