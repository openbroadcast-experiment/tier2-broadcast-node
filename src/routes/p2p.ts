import { FastifyInstance, FastifyServerOptions } from 'fastify';
import { Config, config } from '../config.js';
import { libp2pNode } from '../p2p/node.js';
import { eventHistory, transmissionHistory } from '../p2p/history.js';
import { Static, Type } from '@sinclair/typebox';


const SubscibersQuerystring = Type.Object({
  topic: Type.String(),
})
const AllInOneQuerystring = Type.Object({
  showSensitive: Type.Optional(Type.String()),
})
const SubscribeToTopicBody = Type.Object({
  topic: Type.String(),
})
const PublishToTopicBody = Type.Object({
  topic: Type.String(),
  message: Type.Object({}),
})
type SubscibersQuerystringType = Static<typeof SubscibersQuerystring>
type AllInOneQuerystringType = Static<typeof AllInOneQuerystring>
type SubscribeToTopicBodyType = Static<typeof SubscribeToTopicBody>
type PublishToTopicBodyType = Static<typeof PublishToTopicBody>

export default async function p2pRoutes(
  server: FastifyInstance,
  options: FastifyServerOptions,
) {


  //TODO This route is for demo purposes only. Publishing is done by users through the /publish route
  server.post<{Body: PublishToTopicBodyType}>("/p2p/publish", {
    schema: {
      body: PublishToTopicBody,
    },
    handler: async (request, reply) => {
      const {topic, message} = request.body
      const res = await libp2pNode.services.pubsub.publish(topic, new TextEncoder().encode(JSON.stringify(message)))
      return reply.status(200).send(res);
    },
  });

  //TODO This route is for demo purposes only. Topics have predictable ids, so we already know what to listen to
  server.post<{Body: SubscribeToTopicBodyType}>("/p2p/subscribe", {
    schema: {
      body: SubscribeToTopicBody,
    },
    handler: async (request, reply) => {
      const {topic} = request.body
      libp2pNode.services.pubsub.subscribe(topic)
      return reply.status(200).send({result: `successfully subscribed to ${topic}`});
    },
  });

  // All-in-one route to get info about the libp2p node
  server.get<{Querystring: AllInOneQuerystringType}>("/p2p/node", {
    schema: {
      querystring: AllInOneQuerystring,
    },
    handler: async (request, reply) => {
      const {showSensitive} = request.query

      const topics = libp2pNode.services.pubsub.getTopics()
      const subscribers: any = {}
      for(const topic of topics){
        subscribers[topic] = libp2pNode.services.pubsub.getSubscribers(topic)
      }
      const base = {
        peerId: libp2pNode.peerId,
        listenAddresses: libp2pNode.getMultiaddrs(),
        peers: libp2pNode.services.pubsub.getPeers(),
        topics,
        subscribers,
        config,
        transmissionHistory,
        eventHistory,
      }


      if(!showSensitive){
        base.config = {
          ...config,
          privateKey: "hidden",
        }
      }
      return reply.status(200).send(base)
    }
  })

}
