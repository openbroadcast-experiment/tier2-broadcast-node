# Open Broadcast Node

The Open Broadcast Node is a turnkey solution that lets you launch a decentralized event stream at the click of a button

## Features


## Data pipelines

### Ingestion


### Quotas

Each Tier 2 node can have up to 
1. Tier 2 sends a storage request to Tier 1 network
2. Some Tier 1 node receives the storage request and: 
   3. Checks if the file is already stored (in case a Tier 1 failed in the confirmation phase)
   3. Checks if the file is larger than the Tier 2's storage limit
      4. If it is, Tier 1 will send a rejection message to Tier 2
   4. Checks if adding the message would go over Tier 2's storage quoate
      3. If it has, Tier 1 will send a rejection message to Tier 2
         4. Unless the Tier 2 has chosen to use sliding storage, at which point the oldest message(s) will be deleted
      4. If it hasn't, it puts the message into the Tier 1 shared queue
3. Some Tier 1 node reads from the queue and stores the message in shared storage and adds a "pending" flag to metadata
4. If sliding storage was triggered, then Tier 1 will update metadata for old messages to flag them for removal
4. Some Tier 1 node sends a message to other Tier 1s asking them to verify storage
5. Other Tier 1 nodes verify storage and send a message confirming storage to the origin Tier 1
6. After receiving N confirmations, the Tier 1 node sends a storage confirmation message to Tier 2
7. If sliding storage was triggered, Tier 1 sends a message asking other Tier 1s to delete the old messages
   8. Marking the 

Failure routes:
1. Tier 2 will have a 3 minute timeout for storage events in case some system wide outage
2. If one Tier 1 fails to process the storage request entirely (firewall issues, outage, timeout), the message will reappear in the queue after 3 seconds for another Tier 1 to process. If N Tier 1s fail to process the message, it's lost and we make a best effort to notify the Tier 2
   3. Tier 1 nodes will have a 1 minute timeout for processing a storage request. If it takes longer than that, it will exit and attempt to create a message to notify other Tier 1s
3. If one Tier 1 fails a specific step of the storage request, like trying to store the file or trying to flag files for deletion, then it will attempt to retry up to three times or however much time it has left in its timeout
4. 

### Spam protection

There are multiple layers to spam protection:
* Nodes can protect themselves against spam from users trying to write messages through the REST API by:
  * Requiring the user to submit a proof of work
* Nodes protect themselves from other nodes through the following:
  * Requiring the origin node to sign the message, and verifying that signature
  * Economic RLN/slashing (see penalty events below)
    
#### Penalty events

The following violations will result in a node getting disconnected from the broadcast network. Later this will result in slashing (economic RLN):
* Broadcasting a message that doesn't adhere to the CloudEvents standard
* Broadcasting a message who's data payload doesn't contain or fails verification of a signature
* A Tier 1 nodes adds a non-Tier 1 node to the Tier 1 network
* A Tier 1 node serves storage for a user who has asked to be deleted from the network