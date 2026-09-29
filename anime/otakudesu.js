const Otakudesu = {
  metadata: {
    id: "otakudesu",
    name: "Otakudesu",
    baseUrl: "https://otakudesu.blog",
    version: "1.0.0",
    type: "anime",
    lang: "id",
    isNsfw: false
  },

  async getLatest(page = 1) {
    const targetUrl = this.metadata.baseUrl + "/ongoing-anime/page/" + page + "/";
    const html = await bridge.fetchText(targetUrl);
    const $ = bridge.parseHTML(html);

    const results = [];
    $(".venlist ul li").each((_, el) => {
      const anchor = $(el).find(".thumb a");
      results.push({
        id: anchor.attr("href") || "",
        title: $(el).find(".jjudul").text().trim(),
        cover: $(el).find("img").attr("src") || "",
        type: "anime"
      });
    });

    return results;
  },

  async search(query, page = 1) {
    const targetUrl = this.metadata.baseUrl + "/?s=" + encodeURIComponent(query) + "&post_type=anime";
    const html = await bridge.fetchText(targetUrl);
    const $ = bridge.parseHTML(html);

    const results = [];

    // Menggunakan selector yang sesuai dengan HTML mentah: ul.chivsrc li
    $("ul.chivsrc li").each((_, el) => {
      const anchor = $(el).find("h2 a").first();
      const title = anchor.text().trim();
      const href = anchor.attr("href") || anchor.attr("title") || "";
      const cover = $(el).find("img").attr("src") || "";

      if (title && href) {
        results.push({
          id: href,
          title: title,
          cover: cover,
          type: "anime"
        });
      }
    });

    return results;
  },


  async getDetail(itemUrl) {
    const html = await bridge.fetchText(itemUrl);
    const $ = bridge.parseHTML(html);

    const title = $(".fotoanime .infozin .infozings p:contains('Judul')").text().replace("Judul:", "").trim() || $(".jjudul").text();
    const cover = $(".fotoanime img").attr("src") || "";
    const synopsis = $(".sinopsc").text().trim();

    const episodes = [];
    $(".episodelist ul li").each((_, el) => {
      const anchor = $(el).find("a");
      if (anchor.length) {
        episodes.push({
          name: anchor.text().trim(),
          url: anchor.attr("href") || "",
          uploadDate: $(el).find(".zee-release-date").text().trim()
        });
      }
    });

    return {
      title,
      cover,
      synopsis,
      episodes
    };
  },

  async getStreamSources(episodeUrl) {
    const html = await bridge.fetchText(episodeUrl);
    const $ = bridge.parseHTML(html);

    const iframeSrc = $(".responsive-embed iframe").attr("src") || $("iframe").attr("src") || "";

    return [
      {
        quality: "Auto",
        url: iframeSrc,
        isHls: iframeSrc.includes(".m3u8"),
        headers: {
          "Referer": this.metadata.baseUrl
        }
      }
    ];
  }
};

module.exports = Otakudesu;
