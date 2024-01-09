import { Queue, Worker } from 'bullmq';
import { config } from '../../config.js';
import { publishMessage } from './publishQueue.js';
import { MessageReceiveEvent, MessageStatuses, recordMessageStatus, storeMessage } from './queue.js';
import { extractSubjectFromCloudEventV1 } from '../topic.js';
import { ethers } from "ethers";
export const internalMessageQueue = new Queue<MessageReceiveEvent>('messages', {
  connection: {
    host: config.redisUrl,
    port: config.redisPort,
  },
});


const messageWorker = new Worker<MessageReceiveEvent>('messages', async job => {
  // tracer.startSpan('processMessage', {}) //TODO
  console.log(`Publishing message from queue: ${job.data}`);

  // Verify that message came from origin
  const {author} = extractSubjectFromCloudEventV1(job.data.event);
  const authorAddress = ethers.verifyMessage(JSON.stringify(job.data.event), job.data.signature)
  if(authorAddress !== author) {
    throw new Error(`Message is not from the topic author, expected ${author}, got ${authorAddress}`)
  }
  await storeMessage(job.data, config.fullStorage); // Full storage of own messages (full storage is not optional for origin)
  const res = await publishMessage(job.data);
  console.log(`Finished publishing message ${job.data.event.id}`);
}, {
  connection: {
    host: config.redisUrl,
    port: config.redisPort,
  },
});


messageWorker.on('completed', async (job) => {
  //record that message was successfully transmitted
  console.log(`Finished processing message from job: ${job.id}, message: ${job.data.event.id}, marking as complete`);
  await recordMessageStatus(job.data.event.id, MessageStatuses.SUCCESS);
  console.log('Finished marking message as complete (job: ${job.id}, message: ${job.data.event.id})');
});

messageWorker.on(
  'failed',
  async (job, err) => {
    console.error('error processing message', err);
    await recordMessageStatus(job.data.event.id, MessageStatuses.FAILED);
  },
);
