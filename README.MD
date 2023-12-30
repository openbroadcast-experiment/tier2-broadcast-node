# Tier2 Open Broadcast Node

## Responsibilities:
* Receives messages from users/frontend
* Protects Tier 1 against spam from users/frontend
  * In practice this is done by requiring the user/frontend to submit a proof of work and requiring the message to be signed
* Sends messages to Tier 1 (so Tier 1 can broadcast to all other Tier 2 nodes)
* Notifies users of messages received from Tier 1
* (Optional) stores a copy of data to reduce load on Tier 1 (if it has to hit Tier 1 for everything, it'll trigger Tier 1's spam protection)
* (Not required for TBD hackathon) can read data from Tier 1
