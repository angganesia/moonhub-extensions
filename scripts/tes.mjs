import axios from "axios";
import * as cheerio from "cheerio";

const g = {
  metadata: {
    baseUrl: "https://anoboy.be",
  },
  selectors: {
    search: {
      item: "article.bs",
      link: ".bsx a",
      titleAttr: 'h2[itemprop="headline"]',
      coverAttr: "img.ts-post-image",
    },
  },
};

async function scrapeData() {
  try {
    const response = await axios.get(g.metadata.baseUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const $ = cheerio.load(response.data);
    const data = [];

    // Iterasi setiap elemen artikel dengan class .bs
    $(g.selectors.search.item).each((index, element) => {
      const link = $(element).find(g.selectors.search.link).attr("href");
      const title = $(element).find(g.selectors.search.titleAttr).text().trim();
      const img = $(element).find(g.selectors.search.coverAttr).attr("src");

      data.push({
        id: index + 1,
        title,
        link,
        img,
      });
    });

    console.log(data);
  } catch (error) {
    console.error("Terjadi kesalahan saat scraping:", error.message);
  }
}

scrapeData();
