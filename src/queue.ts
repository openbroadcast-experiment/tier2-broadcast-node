import { Queue, QueueEvents, Worker } from 'bullmq';
import { prisma } from './index.js';
import { CloudEventV1 } from 'cloudevents';
import { libp2pNode } from './p2p/node.js';
import { config } from './config.js';


// Keeping as string for now so you don't have to memorize codes, will change later
export enum MessageStatuses {
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS',
}

export type MessageReceiveEvent = CloudEventV1<any>
// typeof CustomEvent<Message<CloudEventV1<any>>>
// Topic structure
export const internalMessageQueue = new Queue<MessageReceiveEvent>('messages', {
  connection: {
    host: config.redisUrl,
    port: config.redisPort,
  },
});
export const publishQueue = new Queue<MessageReceiveEvent>('publish', {
  connection: {
    host: config.redisUrl,
    port: config.redisPort,
  },
});


const publishWorker = new Worker<MessageReceiveEvent>('publish', async job => {
  console.log(`Received message from publish queue: ${job.data}`);

  // tracer.startSpan('processMessage', {}) //TODO

  // Verify that message came from origin
  // await storeMessage(job.data, job.data.detail.data.source === config.did || config.fullStorage);
  await storeMessage(job.data, true); // Full storage of own messages (full storage is not optional for origin)
  const res = await publishMessage(job.data);
  console.log(`Finished publishing message ${job.data.id}`);
}, {
  connection: {
    host: config.redisUrl,
    port: config.redisPort,

  },
});

const messageWorker = new Worker<MessageReceiveEvent>('messages', async job => {
  // tracer.startSpan('processMessage', {}) //TODO
  console.log(`Publishing message from queue: ${job.data}`);

  // Verify that message came from origin
  await storeMessage(job.data, config.fullStorage); // Full storage of own messages (full storage is not optional for origin)
  const res = await publishMessage(job.data);
  console.log(`Finished publishing message ${job.data.id}`);
}, {
  connection: {
    host: config.redisUrl,
    port: config.redisPort,
  },
});


const storeMessage = async (message: MessageReceiveEvent, fullStorage: boolean) => {
  // await prisma.
  console.log('Storing message in database: ' + message.id);
  const res = await prisma.published_data.create({
    data: {
      id: message.id,
      source: message.source,
      type: message.type,
      subject: message.subject,
      status: MessageStatuses.PENDING,
      datacontenttype: message.datacontenttype,
      data: fullStorage ? JSON.stringify(message.data) : "",
      spec_version: message.specversion,
      time: message.time,
    },
  });
  console.log(`Finished storing message ${message.id} in database`);
};

const publishMessage = async (message: MessageReceiveEvent) => {
  return await libp2pNode.services.pubsub.publish(config.myTopic, new TextEncoder().encode(JSON.stringify(message)));
};

messageWorker.on('completed', async (job) => {
  //record that message was successfully transmitted
  console.log(`Finished processing message from job: ${job.id}, message: ${job.data.id}, marking as complete`);
  await recordMessageStatus(job.data.id, MessageStatuses.SUCCESS);
  console.log('Finished marking message as complete (job: ${job.id}, message: ${job.data.id})');
});

messageWorker.on(
  'failed',
  async (job, err) => {
    console.error('error processing message', err);
    await recordMessageStatus(job.data.id, MessageStatuses.FAILED);
  },
);
publishWorker.on('completed', async (job) => {
  //record that message was successfully transmitted
  console.log(`Finished processing message from job: ${job.id}, message: ${job.data.id}, marking as complete`);
  await recordMessageStatus(job.data.id, MessageStatuses.SUCCESS);
  console.log(`Finished marking message as complete (job: ${job.id}, message: ${job.data.id})`)
});

publishWorker.on(
  'failed',
  async (job, err) => {
    console.error(`error processing message (job: ${job.id}, message: ${job.data.id}`, err);
    await recordMessageStatus(job.data.id, MessageStatuses.FAILED);
  },
);

const recordMessageStatus = async (id: string, status: MessageStatuses) => {
  const res = await prisma.published_data.update({
    where: { id },
    data: {
      status: status,
    },
  });
}