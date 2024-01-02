// This route publishes a message to Tier 1
// A Tier 1 node will sever a Tier 2 connection if a Tier 2 spams a Tier 1, so the Tier 2 node should implement spam protection
// See middleware/proofOfWork.ts and middleware/validateMessage.ts for basic spam protection

import { FastifyInstance, FastifyServerOptions } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { ProofOfWorkHeaders, ProofOfWorkHeadersType, requireProofOfWork } from '../middleware/proofOfWork.js';
import { JwtVerifyHeaders, JwtVerifyHeadersType, verifySelfSignedJwt } from '../middleware/verifyJwt.js';
import { libp2pNode } from '../p2p/node.js';
import { CloudEvent, CloudEventV1 } from 'cloudevents';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
export const PublishBody = Type.Object({
  data: Type.Object({}), //TODO A string will work for now, but we need this to be "any" with an encoding param later
});
export type PublishBodyType = Static<typeof PublishBody>

export const JwtPubSig = Type.Object({
  'x-user-sig': Type.String(),
  'x-payload-content-type': Type.String(),
});
export type JwtPubSigType = Static<typeof JwtPubSig>

export async function publishRoute(
  server: FastifyInstance,
  options: FastifyServerOptions,
) {
  server.post<{
    Headers: ProofOfWorkHeadersType & JwtVerifyHeadersType & JwtPubSigType,
    Body: PublishBodyType,
    jwt: string
  }>('/publish', {
    preHandler: [requireProofOfWork, verifySelfSignedJwt],
    schema: {
      headers: { ...ProofOfWorkHeaders, ...JwtVerifyHeaders },
      body: PublishBody,
    },
    handler: async (request, reply) => {
      const { data } = request.body;
      const contentType = request.headers['x-payload-content-type'];
      const { userDid } = request;
      console.log('This is where I\'d send the message to Tier 1... if I had a Tier 1');

      const ce: CloudEventV1<string> = {
        specversion: "1.0.2",
        type: "/dili/classifieds",
        source: userDid,
        id: uuidv4(),
        time: (new Date()).toUTCString(),
        subject: `/dili/classifieds/author/${userDid}/entry_node${config.did}`,
        datacontenttype: contentType || "application/json",
        data: JSON.stringify(data),
      }
      const event = new CloudEvent(ce);

      const res = await libp2pNode.services.pubsub.publish('demo-topic', new TextEncoder().encode(JSON.stringify(event)));
      return reply.status(200).send(res);
    },
  });
}