/* globals Promise */
import { equals, pipe, identity, keys, without } from "ramda";
import {
  chainInterface,
  // preventConflicts,
  Receiver,
  deduplicateMessages,
  allowLeech,
  relayMessages,
  websocketTransport
} from "gun-receiver";
import { receiver as redis } from "gun-redis";
import { suppressor } from "./notabug-peer/json-schema-validation";
const Gun = require("gun/gun");

const validateMessage = ({ json, skipValidation, ...msg }) => {
  if (skipValidation) return { ...msg, json };
  return suppressor.validate(json).then(validated => {
    if (!validated) return console.error(suppressor.validate.errors, json);
    return { ...msg, json: validated };
  });
};

const redisSupport = pipe(
  redis.respondToGets(Gun),
  chainInterface,
//  preventConflicts
);


const skipValidatingKnownData = db => {
  db.onIn(msg => {
    if (msg.skipValidation || !db.get || !msg.json || !msg.json.put || !Gun.redis) return msg;
    const souls = keys(msg.json.put);

    if (!souls.length) return msg;
    return Promise.all(souls.map(
      soul => soul.indexOf("~") === -1 ? Promise.resolve(true) : Gun.redis.get(soul).then(existing => {
        const updated = msg.json.put[soul];

        if (!existing || !updated) return true;
        const propNames = without(["_"], keys(updated));
        const modifiedKey = propNames.find(name =>!equals(existing[name], updated[name]));

        return modifiedKey;
      })
    )).then(hasChanges => {
      if (!hasChanges.length || hasChanges.find(x => x)) return msg;
      return { ...msg, skipValidation: true };
    });
  });

  return db;
};

export default opts =>
  pipe(
    Receiver,
    skipValidatingKnownData,
    db => db.onIn(validateMessage) && db,
    deduplicateMessages,
    allowLeech,
    opts.redis ? redisSupport : identity,
    relayMessages,
    // db => db.onOut(validateMessage) && db,
    opts.port || opts.web ? websocketTransport.server(opts) : identity,
    ...opts.peers.map(peer => websocketTransport.client(peer))
  )(opts);
