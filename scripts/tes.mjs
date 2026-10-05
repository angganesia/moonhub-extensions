// tes.mjs
import axios from "axios";
import * as cheerio from "cheerio";
import g from "../anime/anoboybe.json" with { type: "json" };

class ExtensionManager {
  static async search(qwery) {
    try {
      let qwerys = g.endpoints.search;
      const searchEndpoint = qwerys.replace("{page}", "1").replace("{query}", encodeURIComponent(qwery));
      const fullUrl = g.metadata.baseUrl + searchEndpoint;

      const response = await axios.get(fullUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);
      const data = [];

      $(g.selectors.search.item).each((index, element) => {
        const link = $(element).find(g.selectors.search.link).attr("href");
        const title = $(element).find(g.selectors.search.titleAttr).text().trim();
        const img = $(element).find(g.selectors.search.coverAttr).attr("src");

        data.push({
          index: index + 1,
          title,
          link,
          img,
        });
      });

      return data;
    } catch (error) {
      console.error("Terjadi kesalahan saat scraping search:", error.message);
    }
  }

  static async getOptionList() {
    try {
      const optionListEndpoint = g.endpoints.optionList;
      const fullUrl = g.metadata.baseUrl + optionListEndpoint;

      const response = await axios.get(fullUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);
      const optionConfig = g.selectors.optionList;
      const dynamicFilterGroups = {};

      if (optionConfig.groups && Array.isArray(optionConfig.groups)) {
        optionConfig.groups.forEach((group) => {
          const options = [];
          $(group.item).each((_, element) => {
            const el = $(element);
            const inputEl = el.find("input");
            const labelEl = el.find("label");

            const value = inputEl.attr("value");
            const label = labelEl.text().trim() || inputEl.attr("id") || "";

            if (
              label &&
              value !== undefined &&
              !label.toLowerCase().includes("semua") &&
              label.toLowerCase() !== "all"
            ) {
              if (!options.some((opt) => opt.value === value)) {
                options.push({ label, value });
              }
            }
          });

          dynamicFilterGroups[ group.key ] = {
            title: group.title,
            options: options,
          };
        });
      }

      return dynamicFilterGroups;
    } catch (error) {
      console.error("Terjadi kesalahan saat scraping optionList:", error.message);
      return {};
    }
  }

  static async detail(id) {
    try {
      const detail = g.selectors.detail;

      const response = await axios.get(id, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      const genres = [];
      $(detail.genres).each((_, el) => {
        genres.push($(el).text().trim());
      });

      const episodes = [];
      $(detail.episodes).each((_, el) => {
        const epLink = $(el).attr("href");
        const num = $(el).find(detail.epNum).text().trim();
        const epTitle = $(el).find(detail.epTitle).text().trim();
        const date = $(el).find(detail.epDate).text().trim();

        episodes.push({
          number: num || null,
          title: epTitle || $(el).text().trim(),
          date: date || null,
          link: epLink || null,
        });
      });

      const data = {
        title: $(detail.title).text().trim(),
        cover: $(detail.cover).attr("src"),
        synopsis: $(detail.synopsis).text().trim(),
        status: $(detail.status).first().text().trim(),
        genres: genres,
        episodes: episodes,
      };

      return data;
    } catch (error) {
      console.error("Terjadi kesalahan saat scraping detail:", error.message);
    }
  }
}

async function start() {
  console.log("--- TEST 1: Menguji Ketujuh Opsi Filter Dinamis Server ---");
  const options = await ExtensionManager.getOptionList();
  console.log(JSON.stringify(options, null, 2));

}

start();
