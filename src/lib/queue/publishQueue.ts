import { CloudEventV1 } from 'cloudevents';
import { Queue, Worker } from 'bullmq';
import { config } from '../../config.js';
import { libp2pNode } from '../../p2p/node.js';
import { MessageReceiveEvent, MessageStatuses, recordMessageStatus, storeMessage } from './queue.js';

type MessagePublishEvent = CloudEventV1<any>

export const publishQueue = new Queue<MessagePublishEvent>('publish', {
  connection: {
    host: config.redisUrl,
    port: config.redisPort,
  },
});
export const publishWorker = new Worker<MessagePublishEvent>('publish', async job => {
  console.log(`Received message from publish queue: ${job.data}`);

  // tracer.startSpan('processMessage', {}) //TODO

  // Verify that message came from origin
  // await storeMessage(job.data, job.data.detail.data.source === config.did || config.fullStorage);
  const signature = await config.wallet.signMessage(JSON.stringify(job.data)); //TODO Support other encodings
  const messageWithSig: MessageReceiveEvent = {
    signature,
    event: job.data,
  }
  await storeMessage({ signature, event: messageWithSig.event }, true); // Full storage of own messages (full storage is not optional for origin)
  const res = await publishMessage(messageWithSig);
  console.log(`Finished publishing message ${job.data.id}`);
}, {
  connection: {
    host: config.redisUrl,
    port: config.redisPort,

  },
});

export const publishMessage = async (message: MessageReceiveEvent) => {
  return await libp2pNode.services.pubsub.publish(config.myTopic, new TextEncoder().encode(JSON.stringify(message)));
};

publishWorker.on('completed', async (job) => {
  //record that message was successfully transmitted
  console.log(`Finished processing message from job: ${job.id}, message: ${job.data.id}, marking as complete`);
  await recordMessageStatus(job.data.id, MessageStatuses.SUCCESS);
  console.log(`Finished marking message as complete (job: ${job.id}, message: ${job.data.id})`);
});

publishWorker.on(
  'failed',
  async (job, err) => {
    console.error(`error processing message (job: ${job.id}, message: ${job.data.id}`, err);
    await recordMessageStatus(job.data.id, MessageStatuses.FAILED);
  },
);