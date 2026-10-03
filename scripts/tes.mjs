import axios from "axios";
import * as cheerio from "cheerio";
import g from "../anime/anoboybe.json" with { type: "json" };

class ExtensionManager {
  static async search(qwery) {
    try {
      let qwerys = g.endpoints.search;
      const fullUrl = g.metadata.baseUrl + qwerys.replace("{query}", qwery);

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
      console.error("Terjadi kesalahan saat scraping:", error.message);
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

      // Mengambil daftar genre
      const genres = [];
      $(detail.genres).each((_, el) => {
        genres.push($(el).text().trim());
      });

      // Mengambil daftar episode
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
  const stage1 = await ExtensionManager.search("one piece");
  console.log(stage1);
  if (stage1 && stage1.length > 0) {
    const stage2 = await ExtensionManager.detail(stage1[ 0 ].link);
    console.log(stage2);
  }
}

start();
