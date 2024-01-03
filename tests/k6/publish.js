import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10, // Number of virtual users
  duration: '10s', // Duration of the test
};

const URL = 'http://localhost:8080/publish'

export default function () {
  // Data to be sent, modify according to your API's expected format
  const payload = JSON.stringify({
    data: {
      title: 'Example Title',
      content: 'Example content...',
      tags: ['example', 'k6', 'performance'],
      complex_data_type: {
        nested: true,
        random_array: [1, 2, 3, 4, 5],
        random_boolean: true,
      }
    }
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJpYXQiOjIwMjQsImF1ZCI6ImRpZDpwa2g6ZWlwMTU1OjE6MHgxNGRDNzk5NjRkYTJDMDhiMjM2OThCM0QzY2M3Q2EzMjE5M2Q5OTU1IiwibmFtZSI6InBheWxvYWQtc2lnIiwicGF5bG9hZF9jaWQiOiJiYWd1cWVlcmFsMmRuZXp1YW41dWgzM2Zhejd2eGk1bW9wanhqbWYycGN6cndhdXBlYmIzbHNvbTRxN2hhIiwiaXNzIjoiZGlkOnBraDplaXAxNTU6MToweGYzOUZkNmU1MWFhZDg4RjZGNGNlNmFCODgyNzI3OWNmZkZiOTIyNjYifQ.S2kAlLHxkqO3y1bNjcgRkk_X4178qDU2icqptTffDL0_gkDrzkXYLg75RyNErblrYRVU_76kAV18nPPWUT6z_g',
      'X-User-DID': 'did:pkh:eip155:1:0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      'X-POW-Solution': '$argon2id$v=19$m=1000,t=1,p=2$NjUzNTMzMzA2NTYyMzUzOTMyMzkzNjYyMzA2NDMyMzgzMjM4NjMzNTY0NjQ2MTMwMzIzOTM2MzkzMjMyMzkzMTM0NjQzMTM5MzYzNjM1NjE2MTM1NjQ2MTYyMzE2NjYyMzE2MjM1Mzk2MzY0MzczODYxNjEzOTYxNjI2NDM4MzkzMzM0MzI2MzYzNjYzNzM1MzIzMzMyMzEzODY2MzEzMzM0MzIzMTMwNjE2NTY0MzE2NjM4Mzc2MTY2NjIzNDY2MzUzNzY2MzI2NjM1MzYzODY1MzAzMDMwMzEzMjM1MzY2MTMzNjY2NDY1Mzc2NDY2MzIzNDY2MzczMTM0MzI2MjM3MzEzNDMzMzkzMjMyMzMzMTM4NjM2NjYyNjQzMTY2MzM2NTMyMzE2MTM3MzU2MjM3NjMzMzY0MzEzOTY0MzE2NjM5MzUzMTY0MzMzMjMxNjM2MjMwMzQ2MTM4MzUzMzM1MzAzNzMzNjQ2MzMzNjEzNzM2MzA2MjY2NjMzNDY0MzYzMTY0MzA2NTYxNjM2NTM4Mzg2MzM0MzM2MTY1MzY2NDMyMzI2NTM3NjUzMzMyNjYzMjMwMzMzNTM2MzMzMQ$B7BLnTYTRcfH3qUMwqijwr4zjVgAADBCMZHGpcK8nZU'
    },
  };


  let response = http.post(URL, payload, params);

  check(response, {
    'is status 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
