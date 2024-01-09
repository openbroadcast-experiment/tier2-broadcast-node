// This route publishes a message to Tier 1
// A Tier 1 node will sever a Tier 2 connection if a Tier 2 spams a Tier 1, so the Tier 2 node should implement spam protection
// See middleware/proofOfWork.ts and middleware/validateMessage.ts for basic spam protection

import { FastifyInstance, FastifyServerOptions } from 'fastify';
import { Static, Type } from '@sinclair/typebox';
import { CloudEventV1 } from 'cloudevents';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

import { publishQueue } from '../lib/queue/publishQueue.js';

export const PublishBody = Type.Object({
  // signature: Type.String(),
  encoding: Type.String({default: "application/json"}), //TODO Make this an enum
  data: Type.Object({
    // Required properties
  }, {
    additionalProperties: true,  // Allows unknown properties
  })
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
      Headers: /*ProofOfWorkHeadersType & JwtVerifyHeadersType & */ JwtPubSigType,
      Body: PublishBodyType,
      jwt: string
    }>('/publish', {
      preHandler: [/*requireProofOfWork /*verifySelfSignedJwt*/],
      schema: {
        headers: { /*...ProofOfWorkHeaders /*...JwtVerifyHeaders },*/ },
        body: PublishBody,
      },
      handler: async (request, reply) => {
        const { data } = request.body;
        const contentType = request.headers['x-payload-content-type'];
        const { userDid } = request;
        console.log('This is where I\'d send the message to Tier 1... if I had a Tier 1');

        const ce: CloudEventV1<any> = {
          specversion: '1.0.2',
          type: '/dili/classifieds',
          source: userDid,
          id: uuidv4(),
          time: (new Date()).toUTCString(),
          subject: `/dili/classifieds/author/${config.ethereumPublicKey}`,
          datacontenttype: contentType || 'application/json',
          data: data,
        };

        //TODO Verify that subject contains type
        //TODO verify that subject containes author/public key

        const res = await publishQueue.add('messages', ce, { removeOnComplete: true, removeOnFail: true });
        return reply.status(200).send(res);
      },
    });
  }