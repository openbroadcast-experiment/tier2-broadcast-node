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
// Topic structure
export const internalMessageQueue = new Queue<MessageReceiveEvent>('messages', {
  connection: {
    host: config.redisUrl,
    port: config.redisPort,
  },
});

const worker = new Worker<MessageReceiveEvent>('messages', async job => {
  // tracer.startSpan('processMessage', {}) //TODO

  // Verify that message came from origin
  await storeMessage(job.data);
  console.log(`Received message from queue: ${job.data}`);
  const res = await publishMessage(job.data);

}, {
  connection: {
    host: config.redisUrl,
    port: config.redisPort,
  },
});

const storeMessage = async (message: MessageReceiveEvent) => {
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
      data: JSON.stringify(message.data),
      spec_version: message.specversion,
      time: message.time,
    },
  });
};
const publishMessage = async (message: MessageReceiveEvent) => {
  return await libp2pNode.services.pubsub.publish(config.myTopic, new TextEncoder().encode(JSON.stringify(message)));
};


const queueEvents = new QueueEvents('Paint');
queueEvents.on('completed', async ({ jobId }) => {
  //record that message was successfully transmitted
  console.log(`Finished processing message from ${jobId}, marking as complete`);
  const job = await internalMessageQueue.getJob(jobId);
  const res = await prisma.published_data.update({
    where: { id: jobId },
    data: {
      status: MessageStatuses.SUCCESS,
    },
  });
  console.log('Finished marking message as complete');
});

queueEvents.on(
  'failed',
  async ({ jobId, failedReason }: { jobId: string; failedReason: string }) => {
    console.error('error processingMessage', failedReason);
    const job = await internalMessageQueue.getJob(jobId);
    const res = await prisma.published_data.update({
      where: { id: jobId },
      data: {
        status: MessageStatuses.FAILED,
      },
    });//record that message failed
  },
);