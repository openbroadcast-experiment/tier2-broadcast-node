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
import { eventHistory } from './history.js';
import { KadDHT, kadDHT } from '@libp2p/kad-dht';
import { Identify, identify } from '@libp2p/identify';
import { dcutr } from '@libp2p/dcutr';
import type { PubSub } from '@libp2p/interface';
import { yamux } from '@chainsafe/libp2p-yamux';
import { internalMessageQueue } from '../queue.js';


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
  streamMuxers: [yamux(), mplex()],
  // connectionManager:{
  //   dial: true,
  // },
  services: {
    pubsub: gossipsub({
      // emitSelf: true,
      allowPublishToZeroPeers: true,
      awaitRpcMessageHandler: true,
    }),
    ping: ping({
      protocolPrefix: 'ipfs', // default
    }),
    dht: kadDHT({}),
    identify: identify(),
    dcutr: dcutr(),
  },
  peerDiscovery: [mdns()],
});


libp2pNode.services.pubsub.addEventListener('message', async (message) => {
  //TODO If we can make the peer id predictable, we don't need to check the topic for the DID
  eventHistory.push({ eventType: 'message', data: JSON.stringify(message.detail) });
  await internalMessageQueue.add(message.detail.data.id, message);
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
  for (const addr of evt.detail.multiaddrs) {
    try {
      if (addr.toString().includes('127.0.0.1')) {
        console.log('Attempting to connect to  ' + addr);
        await libp2pNode.dial(addr);
        break;
      }
    } catch (e) {
      console.log('Failed to connect to peer:' + e);
    }
  }
  eventHistory.push({ eventType: 'peer:discovery', data: evt.detail });

  // discovered peer
});

libp2pNode.addEventListener('peer:connect', (evt) => {
  console.log('peer:connect %s', evt.detail); // Log connected peer
  eventHistory.push({ eventType: 'peer:connect', data: evt.detail });
});

libp2pNode.services.pubsub.subscribe(config.myTopic);

for (const topic of Object.keys(config.subscribedTopics)) {
  libp2pNode.services.pubsub.subscribe(topic);
}

// print out listening addresses
await libp2pNode.start();


export { libp2pNode };