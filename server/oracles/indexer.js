import { prop, uniq } from "ramda";
import { query } from "../notabug-peer/scope";
import { PREFIX, SOUL_DELIMETER } from "../notabug-peer/util";
import { sorts, multiTopic, sortThings } from "../queries";
import { oracle, basicQueryRoute } from "./oracle";
import { declarativeListing } from "../listings/declarative";

const LISTING_SIZE = 1000;

const FRONTPAGE_TOPICS = [
  "art",
  "ask",
  "books",
  "food",
  "funny",
  "gaming",
  "gifs",
  "movies",
  "music",
  "news",
  "notabug",
  "pics",
  "politics",
  "programming",
  "religion",
  "quotes",
  "science",
  "space",
  "technology",
  "travel",
  "tv",
  "videos",
  "whatever"
];

const CURATOR_IDS = uniq([
  "5vvQz9CTQgpk4alXuJIiHeTBRt4itoueqrHs-Fi0X7A.1iY7DRla-NvhahUszYZCgxXUnMcoLPGlLTU1ldBqINE",
  "EhXn9ob_AgV1w4499yRvEfUrMwwKIw-d3cHWuYAU5Lg.X45TijFVuMrdCN4NYtIiv7Pg_q2V8mvyhVzKlbT72cs",
  "7MMrduZa7qNfw2IrmPH01_AVFwruIOs1lP84syULyuA.qXSQ4LJq-MneJL-NY55urDPOucT3p5IxtL2Hr2cZtt8",
  "Yr3T3rFJacNpTwRCue6tEvmajAjuvNkRCTcHz6HsLlU.THENQfgvkmTKSmOGsVSsS63qaIL8eGFWFfzgNh6zv5o",
  "YOfauvxM4twU4ODt8Nglmtf6OuF4HFM0Jb7qEnqYPy8.5v2LSnhFHzUHGC8OQ237Zkm2I669k4_Gy5kE9lKVLmw",
  "6CGHfCjVF-PLjEkFTDazpVkdD7-qi2lA59grir4Ws64.wOsmeMAp7-Gcq_yTButNeKtinqy-ovNIRBSTUK03WVI",
  "0R5jFQNX4ff0gYPQwqg67qV8rmNLjp2gqyc7lkmvpSY.5lupP8_MAS3rIkdcPv9AiWZ93KcGD4zTSoPKn4nNI4k",
  "7Cm8-PUuhI2Wr5csnZxBVTMyE9z93LEIBcL8cW606Qg.bO915baqt4Mkx4N7bLeY-QnKIVTTOTUPdbQTbbo9TFA",
  "Buttb_yRAGNze8rVzo3m8eIhHYjXBgnxLq5JoIfZvhg.v6BEyy-l7zoMS88lkgR4EA5Hf4UTS3tmV_VE2cSdxKs",
  "nXqxE4xmS2kww5mMQyrmJS_JSXn6Gur7VpscFIIf7hs.bpYbA-2wiQ6MENssj8YDKlAP_hQEZ0LFF4mO6DyMQbM",
  "LesDWK7BcLGNLAtzyAWVwuELI8NKLudyX2E-68OLek4.A8owpiqmANc6yN5fD7UfwSz9kWsRVgBx4obwuCBo6H8",
  "IqcjVSC34GtFs5w59N9kASBbdZKCgHKiQwFFRym9Pr4.8n1bLKu2IXPe3aziyfkDNNo0gsi3reOk1DHSx6DHATs",
  "XHzMA_zabEhwnXYHLaeYyiTdm-Xt4FgWRFuFvwf3hn8.UCNN7-8cd-TMKAB92-ROChYL7tYZBPlvjAUOIxOUAmA",
  "UaWOVCZeTRlFbZs0K8LQM21rkNp2zvXdlLtA011thn0.gWyK6Zodeo43aIQubLlMIY_ByoMtm1gNH5hzwdi6oNI",
  "NGr7RVDtyQLgP9r9qm04Crz_MxloYlOr3ZpmWYi0Q-s.iVqFivkVC_dNm_wZ_oCP91rVreB4DTQLV2n6JAeYJgo",
  "zVAX29cFhylCtkPd0pLOThTWo-vCoeSKEoECMNMAEJM.d_QkGhisTbRStaTbHDEtHjs1Vq1aB_qFIPC0DXBbULc",
  "EB2a-VBhZPhPHFG2ga_-MbzE-6G_24aTjK5D3dbu8VQ.xGruTslH7eDVi10jeVY9rEHMudBUp5pfChjpyUd2cBw",
  "mqsUTvuTU43E3vdKWqWb0bL4ulETedy2kdkPjQr5Zpk.KKNTLAMcfSGXO5Xq7K7XpwDWwiXahkNxKbhkab2-o04",
  "r7k5HvzU8EzXcN_5NUcBecO3ZltdBEYZ9r6CX-UwbRk.4H4IjbanOiRImfyzWU5Zn4-asLd5SSO_PJmv_VPt4tU",
  "VPJPmDnVzi70la1dtvN9YNHIUyPWIkbH-iR8qDotHfY.6KXh-Kg2-l8ZEH65OsMS6yBSip8HuJvb9rhfR9c_eK4",
  "GnKvWZEoLdXqQKIGMSKJeQQmV57QK85SOLa9DP3rvm4.icZFh-IVnGpRSfoCk_GjBE3mjmHtwCdWgN974DR3_AA",
  "qCS827OtiqrnCYuhDDscIaUH-b1Zf4ARqC75TQdveno.mtUOCBbbkrExAec0K5Bmb4d5SJ14ruGPaJBETtYucv0",
  "OpiwW6J7dHN0yrqXKK0hISsM4nJgrcXOPdW7Vwwr0uU.8raor7BxnatrzwISF7xSmCTb9Cgd0IgkQCL--BpWZG0",
  "6xze5qBkwMey6_5K99bttcFb9ylII1UN2mdSeb55elk.7zqXfUVf75CVJuqEUQ_NSN-qTqu1wQ53svNWvFg5gJ4",
  "VqbAno4if8ucqBGK2CRHXzAEDPXlWYmBW709CsRUn4U.sorgqKUe-92XX1gXcznqaGuNtv1V05Zy1R2EN3vqW0I",
  "ihZ67JuKLAA5Npe3fn1QSIuVH6O_DPSHruOlouo8cAo.jxXTSowSMN7VNWMZ67SZzjGAGdROysjsqQHBnZahwGo",
  "PqlI_kDSAqr0QNKaIVLJPVjy8YJ1x_mcYm9KjoKNw3s.n0O6fS07K-vv3u5HyQVhkHWWvx778V77xxjANYrvL_4",
  "3QJDsizzsQVpY6gQzOaqaYfNXUidfbYLyTjRZ0zAINc.Ct09v_DdMEBIpp0OVCnsSHQwCh9E0PreqdFgkhFiWyI",
  "VaYavYjjSEmzj4Ya0iz4d-KMFn4lHPagjtX_psku5Pk.FTWvqAr22bpX9vyF8AzhxPmsxWnOOFNW_DVkZSz7hRU",
  "_QNFTvI18LFSjW2qb5DBP6-sNONfrNKqMwl-mOF8vfw.TVzEaPjefsW1tWNTtswksMUgqTOOVFld-ty2Pz0mOZc",
  "tuBsbzbhO6rQcuC8ffhKnOzIROfkI5kWyk01eGoVY18.o6IeoswbH3TlcGgIjueDsPChvhgVVIX1yHGLZp6VLBA",
  "kf_w4c-urnYNr-9RZk1eAonMqVlTkKNCHi-2xgws6X0.oDBtm6zp20ld3EjiTYK8TI7BzcQ3fl9T8p7CEdgexxs",
  "kTZ3OuDFCCGLKgzy32Q_Oodh0FOrjAeyY5-KHyZMwIA.FvdbFd1zsbG61zIT0SD_S1O0S2qrIBNb6yaZXA7qS3w",
  "f6RbIATo7-nJ6mjvDBZWcg7vU-asmDamY9qq9GxKUfw.u98Ri4vl6pjIir4a0tvCHmg1j7iez0W_jUztCdIodTo",
  "HoT8wl6e5UbHesNzkGeVDa2zUIS6ZWHc-yx2NunKNes.Q2BZxj3MsVDArVPESSjZ_PrD_YM81iPeTKcfdVXP2XI",
  "wxMa_-I6AhvXt9VOxONnv1LByYOBhFAZc8c78STAo5c.vE8K0f0bopBpwr5gy0CUXFVf21HuIjJbxeahIdQOCtY",
  "rzXflBj8oChH5-Fs1IYDeeMNgNz7a3pcrdB8DqXaaLs.ogPJbmDZc-T51woR7Aggbp77-krW-TtRcySp3uG2-Cw",
  "xvtDefKQT_bEJSImPlfgfr-EPXO7SUxFztRdwiT1Tak.TgC0zXaDPY9Enoe2g81-pWCbqRpopzDcoUxn8uC8QJc",
  "uvXPrAAu7Rmkytav-KSiY93yXGM6HQ2-oGDRQRfAkLw.EKOIQnJT1cPTwGJqcqDzZ_lGmsyR9LEgbaJyZsRY4d0",
  "tVv_GHTi8QJQgtw4U4X4linIT6RU0CvQPnPmNMAI6ns.hES2aS082-8hOvAS8Tf5Q6B3tK3mW0cdykebwvPv6dg"
]);

const CENSOR_IDS = [
  "Wca7b2b7PnXacwBALo28ICWt9Czgy28LOuHES-Avd8c.BgmQH_1XTPqel7H16TJ64poUsh0Cg1tIxHbKN2tf1as"
];

export default oracle({
  name: "indexer",
  concurrent: 1,
  routes: [
    basicQueryRoute({
      path: `${PREFIX}/t/:topic/firehose@~:id1.:id2.`,
      priority: 75,
      checkMatch: ({ topic }) =>
        topic && topic.toLowerCase() === topic && topic.indexOf(":") === -1,
      query: query((scope, { match: { topic, id1, id2 } }) => {
        const normalTopics =
          topic === "front" ? FRONTPAGE_TOPICS : topic.split("+");
        const submitTopic =
          topic === "front" || topic === "all"
            ? "whatever"
            : normalTopics[0] || "whatever";
        const topics = normalTopics.reduce(
          (res, topic) => [...res, topic, `chat:${topic}`, `comments:${topic}`],
          []
        );
        return multiTopic(scope, { topics })
          .then(thingSouls =>
            sortThings(scope, {
              sort: "new",
              thingSouls,
              tabulator: `~${id1}.${id2}`
            })
          )
          .then(things =>
            serializeListing({
              name: topic,
              things: things.slice(0, LISTING_SIZE)
            })
          )
          .then(serialized => ({
            ...serialized,
            includeRanks: false,
            submitTopic,
            isChat: true,
            censors: "",
            tabs: [
              "hot",
              "new",
              "discussed",
              "controversial",
              "top",
              "firehose"
            ]
              .map(tab => `${PREFIX}/t/${topic}/${tab}@~${id1}.${id2}.`)
              .join(SOUL_DELIMETER)
          }));
      })
    }),

    basicQueryRoute({
      path: `${PREFIX}/t/:topic/chat@~:id1.:id2.`,
      priority: 80,
      checkMatch: ({ topic }) =>
        topic && topic.toLowerCase() === topic && topic.indexOf(":") === -1,
      query: query((scope, { match: { topic, id1, id2 } }) => {
        const normalTopics =
          topic === "front" ? FRONTPAGE_TOPICS : topic.split("+");
        const submitTopic =
          topic === "front" || topic === "all"
            ? "whatever"
            : normalTopics[0] || "whatever";
        const topics = normalTopics.reduce(
          (res, topic) => [...res, `chat:${topic}`],
          []
        );
        return multiTopic(scope, { topics })
          .then(thingSouls =>
            sortThings(scope, {
              sort: "new",
              thingSouls,
              tabulator: `~${id1}.${id2}`
            })
          )
          .then(things =>
            serializeListing({
              name: topic,
              things: things.slice(0, LISTING_SIZE)
            })
          )
          .then(serialized => ({
            ...serialized,
            includeRanks: false,
            submitTopic,
            isChat: true,
            censors: "",
            tabs: [
              "hot",
              "new",
              "discussed",
              "controversial",
              "top",
              "firehose",
              "chat"
            ]
              .map(tab => `${PREFIX}/t/${topic}/${tab}@~${id1}.${id2}.`)
              .join(SOUL_DELIMETER)
          }));
      })
    }),

    basicQueryRoute({
      path: `${PREFIX}/t/curated/:sort@~:id1.:id2.`,
      priority: 25,
      checkMatch: ({ sort }) => sort in sorts,
      query: query((scope, { match: { sort, id1, id2 } }) =>
        declarativeListing(
          scope,
          [
            "name curated",
            `tabulator ${id1}.${id2}`,
            "show ranks",
            "submit to whatever",
            `sort ${sort}`,
            ...FRONTPAGE_TOPICS.map(topic => `topic ${topic}`),
            ...CURATOR_IDS.map(id => `curator ${id}`),
            ...CENSOR_IDS.map(id => `censor ${id}`)
          ].join("\n")
        ).then(serialized => ({
          ...serialized,
          tabs: ["hot", "new", "discussed", "controversial", "top"]
            .map(tab => `${PREFIX}/t/curated/${tab}@~${id1}.${id2}.`)
            .join(SOUL_DELIMETER)
        }))
      )
    }),

    basicQueryRoute({
      path: `${PREFIX}/t/front/:sort@~:id1.:id2.`,
      priority: 25,
      checkMatch: ({ sort }) => sort in sorts,
      query: query((scope, { match: { sort, id1, id2 } }) =>
        declarativeListing(
          scope,
          [
            "name front",
            `tabulator ${id1}.${id2}`,
            "show ranks",
            "ups above 1",
            "submit to whatever",
            `sort ${sort}`,
            ...FRONTPAGE_TOPICS.map(topic => `topic ${topic}`),
            ...CENSOR_IDS.map(id => `censor ${id}`)
          ].join("\n")
        ).then(serialized => ({
          ...serialized,
          tabs: ["hot", "new", "discussed", "controversial", "top", "firehose"]
            .map(tab => `${PREFIX}/t/front/${tab}@~${id1}.${id2}.`)
            .join(SOUL_DELIMETER)
        }))
      )
    }),

    basicQueryRoute({
      path: `${PREFIX}/things/:thingid/comments/:sort@~:id1.:id2.`,
      checkMatch: ({ sort }) => sort in sorts,
      priority: 85,
      query: query((scope, { match: { thingid, sort, id1, id2 } }) =>
        declarativeListing(
          scope,
          [`tabulator ${id1}.${id2}`, `op ${thingid}`, `sort ${sort}`].join(
            "\n"
          )
        ).then(serialized => ({
          ...serialized,
          opId: thingid,
          tabs: [`${PREFIX}/things/${thingid}/comments/${sort}@~${id1}.${id2}.`]
        }))
      )
    }),

    basicQueryRoute({
      path: `${PREFIX}/domain/:domain/:sort@~:id1.:id2.`,
      priority: 25,
      checkMatch: ({ sort, domain }) =>
        sort in sorts && domain && domain.toLowerCase() === domain,
      query: query((scope, { match: { domain, sort, id1, id2 } }) =>
        declarativeListing(
          scope,
          [
            `name ${domain}`,
            `tabulator ${id1}.${id2}`,
            ...domain.split("+").map(dm => `domain ${dm}`),
            "show ranks",
            `sort ${sort}`
          ].join("\n")
        ).then(serialized => ({
          ...serialized,
          tabs: ["hot", "new", "discussed", "controversial", "top"]
            .map(tab => `${PREFIX}/domain/${domain}/${tab}@~${id1}.${id2}.`)
            .join(SOUL_DELIMETER)
        }))
      )
    }),

    basicQueryRoute({
      path: `${PREFIX}/t/:topic/:sort@~:id1.:id2.`,
      priority: 60,
      checkMatch: ({ sort, topic }) =>
        sort in sorts && topic && topic.toLowerCase() === topic,
      query: query((scope, { match: { topic, sort, id1, id2 } }) => {
        const topics = topic.split("+");
        const submitTo = topics[0] === "all" ? "whatever" : topics[0];
        return declarativeListing(
          scope,
          [
            `name ${topic}`,
            `tabulator ${id1}.${id2}`,
            ...topics.map(tp => `topic ${tp}`),
            "show ranks",
            `submit to ${submitTo}`,
            `sort ${sort}`
          ].join("\n")
        ).then(serialized => ({
          ...serialized,
          tabs: ["hot", "new", "discussed", "controversial", "top", "firehose"]
            .map(tab => `${PREFIX}/t/${topic}/${tab}@~${id1}.${id2}.`)
            .join(SOUL_DELIMETER)
        }));
      })
    }),

    basicQueryRoute({
      path: `${PREFIX}/user/:authorId/replies/:type/:sort@~:id1.:id2.`,
      priority: 20,
      checkMatch: ({ sort, type, authorId }) =>
        sort in sorts &&
        authorId &&
        type &&
        type.toLowerCase() == type &&
        (type === "overview" || type === "submitted" || type === "comments"),
      query: query((scope, { match: { authorId, type, sort, id1, id2 } }) =>
        declarativeListing(
          scope,
          [
            `tabulator ${id1}.${id2}`,
            "name message",
            `replies to author ${authorId}`,
            `type ${type}`,
            `sort ${sort}`
          ].join("\n")
        ).then(serialized => ({
          ...serialized,
          userid: "",
          tabs: ""
        }))
      )
    }),

    basicQueryRoute({
      path: `${PREFIX}/user/:authorId/:type/:sort@~:id1.:id2.`,
      priority: 30,
      checkMatch: ({ sort, type, authorId }) =>
        sort in sorts &&
        authorId &&
        type &&
        type.toLowerCase() == type &&
        (type === "overview" || type === "submitted" || type === "comments"),
      query: query((scope, { match: { authorId, type, sort, id1, id2 } }) =>
        declarativeListing(
          scope,
          [
            `tabulator ${id1}.${id2}`,
            `author ${authorId}`,
            `type ${type}`,
            `sort ${sort}`
          ].join("\n")
        ).then(serialized => ({
          ...serialized,
          userId: authorId,
          tabs: ["overview", "comments", "submitted"]
            .map(
              tab => `${PREFIX}/user/${authorId}/${tab}/${sort}@~${id1}.${id2}.`
            )
            .join(SOUL_DELIMETER)
        }))
      )
    })
  ]
});

const serializeListing = ({ name = "", things }) => ({
  name,
  ids: things
    .map(prop("id"))
    .filter(id => !!id)
    .join("+")
});
