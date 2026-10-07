// tes.mjs
import axios from "axios";
import * as cheerio from "cheerio";
import g from "../manga/kiryuu.json" with { type: "json" };

const baseUrl = g.metadata.baseUrl;

class ExtensionManager {
  static async fetchHtml(id) {
    const res = await axios.get(id);
    const data = res.data;
    return data;
  }

  static async home(html, args) {
    try {
      if (!html || !args) return;

      const $ = cheerio.load(html);
      const selectors = args.selectors;
      const data = [];

      $(g.selectors);

      return data;
    } catch (error) {
      console.error("Kesalahan home: " + error);
    }
  }

    static async search(query) {
    try {
      const searchConfig = g.selectors.search;
      const method = (searchConfig.method || "GET").toUpperCase();

      let response;
      let fullUrl = g.metadata.baseUrl + (g.endpoints.search || "");
      let nonce = "";

      // Jika menggunakan POST atau membutuhkan nonce, ambil base URL terlebih dahulu
      if (method === "POST" || searchConfig.nonceSelector) {
        const baseRes = await axios.get(g.metadata.baseUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        const $base = cheerio.load(baseRes.data);

        // Ekstrak nonce dari selector form hx-post atau elemen yang ditentukan
        if (searchConfig.nonceSelector) {
          const hxPostAttr = $base(searchConfig.nonceSelector).attr("hx-post") || "";
          const nonceMatch = hxPostAttr.match(/nonce=([a-zA-Z0-9]+)/);
          if (nonceMatch && nonceMatch[1]) {
            nonce = nonceMatch[1];
          }
        }

        // Fallback pencarian nonce di dalam tag script jika tidak ketemu dari hx-post
        if (!nonce) {
          $base("script").each((_, el) => {
            const scriptContent = $base(el).html() || "";
            const match = scriptContent.match(/["']?nonce["']?\s*[:=]\s*["']([a-f0-9]+)["']/i);
            if (match && match[1]) {
              nonce = match[1];
              return false;
            }
          });
        }

        // Susun URL admin-ajax.php lengkap dengan nonce jika menggunakan endpoint tersebut
        if (searchConfig.ajaxUrl) {
          fullUrl = g.metadata.baseUrl + searchConfig.ajaxUrl;
        }
      }

      if (method === "POST") {
        const payloadData = {};
        if (searchConfig.payload) {
          for (const [key, value] of Object.entries(searchConfig.payload)) {
            let processedVal = String(value).replace("{query}", query);
            processedVal = processedVal.replace("{nonce}", nonce);
            payloadData[key] = processedVal;
          }
        }

        // Tambahkan parameter nonce pada URL jika diperlukan oleh endpoint AJAX
        const ajaxTargetUrl = fullUrl.includes("admin-ajax.php") && !fullUrl.includes("nonce=") 
          ? `${fullUrl}?nonce=${nonce}&action=search` 
          : fullUrl;

        response = await axios.post(ajaxTargetUrl, new URLSearchParams(payloadData), {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded"
          }
        });
      } else {
        const searchEndpoint = g.endpoints.search
          .replace("{page}", "1")
          .replace("{query}", encodeURIComponent(query))
          .replace("{nonce}", nonce);
        fullUrl = g.metadata.baseUrl + searchEndpoint;

        response = await axios.get(fullUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
      }

      console.log(response.data)

      const $ = cheerio.load(response.data);
      const data = [];

      $(searchConfig.item).each((index, element) => {
        const el = $(element);
        const link = el.attr("href");
        const title = el.find(searchConfig.titleAttr).text().trim() || el.attr(searchConfig.titleAttr);
        const img = el.find(searchConfig.coverAttr).attr("src") || el.find(searchConfig.coverAttr).attr("data-src");
        const synopsis = searchConfig.synopsisAttr ? el.find(searchConfig.synopsisAttr).text().trim() : "";

        if (link) {
          data.push({
            index: data.length + 1,
            title,
            link,
            img,
            ...(synopsis ? { synopsis } : {})
          });
        }
      });

      return data;
    } catch (error) {
      console.error("Terjadi kesalahan saat scraping search:", error.message);
      return [];
    }
  }

  static async getOptionList() {
    try {
      const optionListEndpoint = g.endpoints.optionList;
      const fullUrl = g.metadata.baseUrl + optionListEndpoint;

      const response = await axios.get(fullUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      const $ = cheerio.load(response.data);
      const optionConfig = g.selectors.optionList;
      const dynamicFilterGroups = {};

      if (optionConfig.groups && Array.isArray(optionConfig.groups)) {
        optionConfig.groups.forEach(group => {
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
              if (!options.some(opt => opt.value === value)) {
                options.push({ label, value });
              }
            }
          });

          dynamicFilterGroups[group.key] = {
            title: group.title,
            options: options
          };
        });
      }

      return dynamicFilterGroups;
    } catch (error) {
      console.error(
        "Terjadi kesalahan saat scraping optionList:",
        error.message
      );
      return {};
    }
  }

  static async detail(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          Referer: g.metadata.baseUrl
        }
      });

      const $ = cheerio.load(response.data);

      const genres = [];
      $(g.selectors.detail.genres).each((_, el) => {
        genres.push($(el).text().trim());
      });

      let json = null;

      $(g.selectors.detail.json.item).each((_, el) => {
        try {
          const jsonData = JSON.parse($(el).html());
          const type = jsonData["@type"];
          const aray =
            type.includes(g.selectors.detail.json.type) &&
            type.includes(g.selectors.detail.json.type1);

          if (aray) {
            json = jsonData;
          }
        } catch (error) {}
      });

      const episodes = [];
      $(g.selectors.detail.episodes).each((index, element) => {
        const num = $(element)
          .find(g.selectors.detail.epTitle)
          .text()
          .trim().replace("Chapter ", "")
        const title = $(element)
          .find(g.selectors.detail.epTitle)
          .text()
          .trim();
        const link = $(element).find(g.selectors.detail.epLink).attr("href");
        const date = $(element).find(g.selectors.detail.epDate).attr("datetime"); // Atau gunakan .text().trim() jika ingin mengambil format teks "10 days ago"

        episodes.push({
          num,
          title,
          link,
          date
        });
      });
      return {
        title: $(g.selectors.detail.title).text().trim(),
        synopsis: $(g.selectors.detail.synopsis).text().trim(),
        cover: $(g.selectors.detail.cover).attr("src") || "tidak ketemu",
        genres,
        type: $(g.selectors.detail.type).text().trim(),
        jsonData: json,
        episodes,
        epidodeLength: episodes.length
      };
    } catch (error) {
      console.error(
        "Terjadi kesalahan saat scraping detail via JSON-LD:",
        error.message
      );
    }
  }

  static async watch(url) {
    const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          Referer: g.metadata.baseUrl
        }
      });

      const $ = cheerio.load(response.data);
   
    const imageUrls = [];

$(g.selectors.stream.defaultIframe).each((index, element) => {
    const src = $(element).attr('src');
    if (src) {
        imageUrls.push(src);
    }
});
    return imageUrls
  }
}

async function start() {
  const mangaLink = "https://v7.kiryuu.to/manga/one-piece/chapter-1.147848/";
  const linkDetail = "https://v7.kiryuu.to/manga/time-healer-ceres/"

  const detailResult = await ExtensionManager.detail("https://v7.kiryuu.to/manga/one-piece/");
  console.log("Hasil Detail:", JSON.stringify(detailResult, null, 2));
}

start();
