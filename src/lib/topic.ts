import { CloudEventV1 } from 'cloudevents';


type ExtractedSubject = {
  type: string;
  author: string;
}

export function extractSubjectFromCloudEventV1(event: CloudEventV1<any>): ExtractedSubject | null {
  const authorPattern = /\/author\/(.*)/;
  const match = event.subject.match(authorPattern);
  if (match && match[1]) {
    return {
      type: event.type,
      author: match[1],
    };
  }
  return null;
}