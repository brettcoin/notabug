/* globals Promise */
import Route from "route-parser";
import Queue from "better-queue";
import { prop, propOr, pathOr } from "ramda";

const getLatestTimestamp = node => {
  let latest = 0;
  const timestamps = pathOr({}, ["_", ">"], node);

  for (const key in timestamps) {
    const ts = timestamps[key];
    if (ts > latest) latest = ts;
  }
  return latest;
};

export const combineOracles = oracles => ({
  onGet: (...args) => oracles.forEach(orc => orc.onGet && orc.onGet(...args)),
  onPut: (...args) => oracles.forEach(orc => orc.onPut && orc.onPut(...args))
});

export const oracle = specs => {
  const listeners = {};
  const timestamps = {};
  const registerListener = (listenForSoul, updateSoul) => {
    if (listenForSoul === updateSoul) return;
    const recomputes = listeners[listenForSoul] = listeners[listenForSoul] || {}; // eslint-disable-line
    recomputes[updateSoul] = true;
  };
  const routes = specs.routes.map(({ path, ...rest }) => ({ matcher: new Route(path), path, ...rest }));
  const findRouteForSoul = soul => {
    let match = null;
    const route = routes.find(rt => (match = rt.matcher.match(soul)));
    if (route && route.checkMatch && !route.checkMatch(match)) return null;
    return route ? { ...route, soul, match, query: scope => route.query(scope, match) } : null;
  };
  let computedPub;

  const cacheTimestamp = (soul, ts) => {
    if (!timestamps[soul] || ts > timestamps[soul]) {
      timestamps[soul] = ts;
    }
  };
  const getTimestamp = soul => timestamps[soul];

  const onGet = (nab, msg) => {
    if (!thisOracle.nab) thisOracle.nab = nab;
    if (!computedPub) {
      const me = nab.isLoggedIn();
      if (!me || !me.pub) return;
      computedPub = `${me.pub}.`; // eslint-disable-line
    }
    if (!computedPub) return;

    for (const propName in (msg.get || {})) {
      const soul = msg.get[propName];
      if (soul.indexOf(computedPub) === -1) return;
      const route = findRouteForSoul(soul);
      if (route) worker.push({ id: `get:${soul}`, soul, method: "onGet", priority: route.priority || 50 });
    }
    if (msg.get && msg.get["#"]) {
      const soul = msg.get["#"];
      if (soul.indexOf(computedPub) === -1) return;
      const route = findRouteForSoul(soul);
      if (route) worker.push({ id: `get:${soul}`, soul, method: "onGet", priority: route.priority || 50 });
    }
  };

  const onPut = (nab, msg) => {
    if (!thisOracle.nab) thisOracle.nab = nab;
    for (const soul in msg.put || {}) {
      if (!(soul in listeners)) continue;
      const latest = getLatestTimestamp(msg.put[soul]);
      for (const updateSoul in listeners[soul]) {
        const route = findRouteForSoul(updateSoul);
        if (!route) continue;
        worker.push({
          id: `put:${updateSoul}`,
          soul: updateSoul,
          method: "onPut",
          updatedSoul: soul,
          priority: route.priority || 50,
          latest
        });
      }
    }
  };

  const priority = (action, cb) => cb(null, propOr(50, "priority", action));
  const worker = (new Queue((action, done) => {
    const { soul, method } = action || {};
    if (!soul) return console.warn("Invalid worker action", action) || done(); // eslint-disable-line
    const route = findRouteForSoul(soul);
    if (!route) return console.warn("Invalid worker soul", action) || done(); // eslint-disable-line
    try {
      if (method === "onGet") return route.onGet(thisOracle, route, action).then(() => done());
      if (method === "onPut") return route.onPut(thisOracle, route, action).then(() => done());
    } catch (e) {
      console.error("oracle worker error", e.stack || e);
    }
    done();
  }, { concurrent: specs.concurrent || 100, priority }));

  const thisOracle = { registerListener, cacheTimestamp, getTimestamp, findRouteForSoul, onGet, onPut };
  return thisOracle;
};

export const basicQueryRoute = spec => ({
  ...spec,
  doUpdate: (orc, route, existing, timestamp) => {
    const scope = orc.nab.newScope({ noGun: true });
    return spec.query(scope, route).then(r => {
      // this is a workaround for a lame SEA bug
      Object.keys(r).forEach(key => {
        if (r[key] !== null) r[key] = `${r[key]}`; // eslint-disable-line no-param-reassign
      });

      if (
        !existing ||
        Object.keys(r || {}).find(key => {
          if (key !== "_" && r[key] !== existing[key]) return true;
        })
      ) {
        console.log("updating", route.soul);
        orc.nab.gun.get(route.soul).put(r);
        timestamp && orc.cacheTimestamp(route.soul);
      }

      return scope;
    });
  },

  onGet: (orc, route) => {
    const scope = orc.nab.newScope({ noGun: true });
    const now = (new Date()).getTime();
    const updated = orc.getTimestamp(route.soul);
    if ((now - updated) < (1000 * 60 * 2)) return Promise.resolve();
    console.log("onGet", route.soul);
    return scope.get(route.soul).then(existing => {
      orc.cacheTimestamp(route.soul, getLatestTimestamp(existing));

      if (parseInt(prop("locked", existing), 10)) {
        console.log("Locked", route.soul, existing);
        return Promise.resolve(existing);
      }
      return route.doUpdate(orc, route, existing).then(queryScope => {
        for (const key in queryScope.getAccesses()) {
          key !== route.soul && orc.registerListener(key, route.soul);
        }
      });
    });
  },

  onPut: (orc, route, { soul, updatedSoul, latest=0 } = {}) => {
    const scope = orc.nab.newScope({ noGun: true });
    console.log("onPut", { updating: soul, from: updatedSoul });
    const knownTimestamp = orc.getTimestamp(soul);
    if (latest && knownTimestamp && knownTimestamp > latest) return Promise.resolve();
    return scope.get(route.soul).then(existing => {
      const current = getLatestTimestamp(existing);
      if (latest && latest < current) return;
      return route.doUpdate(orc, route, existing, current);
    });
  }
});