# Open Broadcast Node

The Open Broadcast Node is a turnkey solution that lets you launch a decentralized event stream at the click of a button

## Features


## Data pipelines

### Ingestion


### Spam protection

There are multiple layers to spam protection:
* Nodes can protect themselves against spam from users trying to write messages through the REST API by:
  * Requiring
* Nodes protect themselves from other nodes through the following:
  * Requiring the origin node to sign the message, and verifying that signatureasxnnnnn
  * Economic RLN/slashing (see penalty events below)
    
#### Penalty events

The following violations will result in a node getting disconnected from the broadcast network. Later this will result in slashing (economic RLN):
* Broadcasting a message that doesn't adhere to the CloudEvents standard
* Broadcasting a message who's data payload doesn't contain or fails verification of a signature