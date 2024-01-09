import { prisma } from '../../index.js';
import { CloudEventV1 } from 'cloudevents';


// Keeping as string for now so you don't have to memorize codes, will change later
export enum MessageStatuses {
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS',
}

export type MessageReceiveEvent = {
  signature: string,
  event: CloudEventV1<any>,
}


export const storeMessage = async (message: MessageReceiveEvent, fullStorage: boolean) => {
  // await prisma.
  const { signature, event } = message;

  console.log('Storing in database: ' + event.id);
  const res = await prisma.published_data.create({
    data: {
      id: event.id,
      source: event.source,
      type: event.type,
      subject: event.subject,
      status: MessageStatuses.PENDING,
      datacontenttype: event.datacontenttype,
      signature,
      data: fullStorage ? JSON.stringify(event) : '',
      spec_version: event.specversion,
      time: event.time,
    },
  });
  console.log(`Finished storing message ${event.id} in database`);
};


export const recordMessageStatus = async (id: string, status: MessageStatuses) => {
  const res = await prisma.published_data.update({
    where: { id },
    data: {
      status: status,
    },
  });
};