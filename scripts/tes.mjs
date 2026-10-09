// tes.mjs
import axios from "axios";
import * as cheerio from "cheerio";
import g from "../anime/samehadaku.json" with { type: "json" };

const host = g.metadata.baseUrl;
const endpoints = g.endpoints;
const selectors = g.selectors;

async function scrap(action, url, args = {}) {
  try {
    console.log("[LOG] mulai scrap: " + action);
    let page = args?.page || "1";
    let query = args?.query || "";

    let data;
    let $;

    if (action !== "search") {
      const res = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Android 15; Mobile; rv:157.0) Gecko/157.0 Firefox/157.0"
        },
        timeout: 7000 // Berikan timeout karena proxy gratis terkadang lambat
      });
      data = res.data;
      $ = cheerio.load(data);
    }

    switch (action) {
      case "detail":
        const selectorDetail = selectors.detail;
        const genres = [];
        $(selectorDetail.genres).each((_, el) => {
          genres.push($(el).text().trim());
        });

        const episodes = [];
        $(selectorDetail.episodes.item).each((idx, el) => {
          episodes.push({
            id: ++idx,
            link: $(el).find(selectorDetail.episodes.epTitle).attr("href"),
            title: $(el).find(selectorDetail.episodes.epTitle).text().trim(),
            date: $(el).find(selectorDetail.episodes.epDate).text().trim(),
            number: $(el).find(selectorDetail.episodes.epNum).text().trim()
          });
        });

        const data = {
          title: $(selectorDetail.title).text().trim() || "",
          cover:
            $(selectorDetail.cover).attr("href") ||
            $(selectorDetail.cover).attr("src") ||
            "",
          synopsis: $(selectorDetail.synopsis).text().trim() || "",
          genres,
          status: $(selectorDetail.status).text().trim() || "",
          studio: $(selectorDetail.studio).text().trim() || "",
          released: $(selectorDetail.released).text().trim() || "",
          season: $(selectorDetail.season).text().trim() || "",
          type: $(selectorDetail.type).text().trim() || "",
          director: $(selectorDetail.director).text().trim() || "",
          trailer: $(selectorDetail.trailer).text().trim() || "",
          episodes
        };
        console.log(JSON.stringify(data, null, 2));
        break;
      case "watch":
        const selectorStream = selectors.stream;

        const defaultIframe = $(selectorStream.defaultIframe).attr("src");
        const urlDetail = $(selectorStream.urlDetail).attr("href") || ""
        console.log("defaultIframe: " + defaultIframe);
        console.log("urlDetail: " + urlDetail);
        break;
      case "search":
        const selectorSearch = selectors.search;
        const endpointSearch = endpoints.search;
        const endpointFinal = endpointSearch
          .replace("{page}", page)
          .replace("{query}", query);

        const finalUrl = host + endpointFinal;
        console.log("FINAL URL: " + finalUrl);
        const res = await axios.get(finalUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Android 15; Mobile; rv:157.0) Gecko/157.0 Firefox/157.0"
          },
          timeout: 7000
        });
        const html = res.data;
        $ = cheerio.load(html);

        const dataSearch = [];
        $(selectorSearch.item).each((idx, el) => {
          const e = $(el);

          dataSearch.push({
            id: ++idx,
            link: e.find(selectorSearch.link).attr("href"),
            title: e.find(selectorSearch.titleAttr).text().trim(),
            coverAttr: e.find(selectorSearch.coverAttr).attr("src")
          });
        });

        console.log(JSON.stringify(dataSearch, null, 2));
        break;
      default:
        console.log("tidak ada action");
    }
  } catch (error) {
    console.log("[LOG] " + error);
  }
}

const link_a = "https://anoboy.be/one-piece-episode-1179-subtitle-indonesia/"
const link_b = "https://v2.samehadaku.how/one-piece-episode-1180/"

scrap("watch", link_b, { query: "one piece" });
