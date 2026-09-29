const Otakudesu = {
  metadata: {
    id: "kiryuu",
    name: "Kiryuu",
    baseUrl: "https://v7.kiryuu.to",
    version: "1.0.0",
    type: "manga",
    lang: "id",
    isNsfw: false
  },

  // 1. Ambil Katalog Terbaru / Home
  async getLatest(page = 1) {
    const targetUrl = `${this.metadata.baseUrl}/ongoing-anime/page/${page}/`;
    const html = await bridge.fetchText(targetUrl);
    const $ = bridge.parseHTML(html);

    const results = [];
    $(".venlist ul li").each((_, el) => {
      const anchor = $(el).find(".thumb a");
      results.push({
        id: anchor.attr("href"),
        title: $(el).find(".jjudul").text().trim(),
        cover: $(el).find("img").attr("src"),
        type: "anime"
      });
    });

    return results;
  },

  // 2. Pencarian Anime
  async search(query, page = 1) {
    const targetUrl = `${this.metadata.baseUrl}/?s=${encodeURIComponent(query)}&post_type=anime`;
    const html = await bridge.fetchText(targetUrl);
    const $ = bridge.parseHTML(html);

    const results = [];
    $(".chlist li").each((_, el) => {
      const anchor = $(el).find("a");
      results.push({
        id: anchor.attr("href"),
        title: anchor.text().trim(),
        cover: $(el).find("img").attr("src") || "",
        type: "anime"
      });
    });

    return results;
  },

  // 3. Detail Anime & Episode List
  async getDetail(itemUrl) {
    const html = await bridge.fetchText(itemUrl);
    const $ = bridge.parseHTML(html);

    const title = $(".fotoanime .infozin .infozings p:contains('Judul')").text().replace("Judul:", "").trim() \vert{ }\vert{ } $(".jjudul").text();
    const cover = $(".fotoanime img").attr("src");
    const synopsis = $(".sinopsc").text().trim();

    const episodes = [];
    $(".episodelist ul li").each((_, el) => {
      const anchor = $(el).find("a");
      if (anchor.length) {
        episodes.push({
          name: anchor.text().trim(),
          url: anchor.attr("href"),
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

  // 4. Extract Stream Video
  async getStreamSources(episodeUrl) {
    const html = await bridge.fetchText(episodeUrl);
    const $ = bridge.parseHTML(html);

    const iframeSrc = $(".responsive-embed iframe").attr("src") \vert{ }\vert{ } $("iframe").attr("src");

    return [
      {
        quality: "Auto",
        url: iframeSrc || "",
        isHls: iframeSrc ? iframeSrc.includes(".m3u8") : false,
        headers: {
          "Referer": this.metadata.baseUrl
        }
      }
    ];
  }
};

export default Otakudesu;