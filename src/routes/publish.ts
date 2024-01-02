// This route publishes a message to Tier 1
// A Tier 1 node will sever a Tier 2 connection if a Tier 2 spams a Tier 1, so the Tier 2 node should implement spam protection
// See middleware/proofOfWork.ts and middleware/validateMessage.ts for basic spam protection

import { FastifyInstance, FastifyServerOptions } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { ProofOfWorkHeaders, ProofOfWorkHeadersType, requireProofOfWork } from '../middleware/proofOfWork.js';
import { JwtVerifyHeaders, JwtVerifyHeadersType, verifySelfSignedJwt } from '../middleware/verifyJwt.js';
import { libp2pNode } from '../p2p/node.js';
import { CloudEvent, CloudEventV1 } from 'cloudevents';

export const PublishBody = Type.Object({
  data: Type.Object({}), //TODO A string will work for now, but we need this to be "any" with an encoding param later
});
export type PublishBodyType = Static<typeof PublishBody>

export const JwtPubSig = Type.Object({
  'x-user-sig': Type.String(),
});
export type JwtPubSigType = Static<typeof JwtPubSig>

export async function publishRoute(
  server: FastifyInstance,
  options: FastifyServerOptions,
) {
  server.post<{
    Headers: ProofOfWorkHeadersType & JwtVerifyHeadersType,
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

      console.log('This is where I\'d send the message to Tier 1... if I had a Tier 1');

      const ce: CloudEventV1<string> = {
        id: request.jwt,
        specversion: '1.0',
        source: '/publish',
        datacontenttype: 'application/json', //TODO This can be specified by the user in the POST body, default to application/json
        type: 'UserPushData',
        //TODO Missing subject
        //TODO Missing time
        //TODO Should we support encoding the data in base64?
        data: JSON.stringify(data),
      };
      const event = new CloudEvent(ce);

      const res = await libp2pNode.services.pubsub.publish('demo-topic', new TextEncoder().encode(JSON.stringify(event)));
      return reply.status(200).send(res);
    },
  });
}