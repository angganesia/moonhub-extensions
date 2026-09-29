const Otakudesu = {
  metadata: {
    id: "otakudesu",
    name: "Otakudesu",
    baseUrl: "https://otakudesu.blog",
    version: "1.2.0",
    type: "anime",
    lang: "id",
    isNsfw: false,
  },

  async getLatest(page = 1) {
    const targetUrl = this.metadata.baseUrl + "/ongoing-anime/page/" + page + "/";
    const html = await bridge.fetchText(targetUrl);
    const $ = bridge.parseHTML(html);

    const results = [];
    $(".venlist ul li").each((_, el) => {
      const anchor = $(el).find(".thumb a");
      const title = $(el).find(".jjudul").text().trim();
      const cover = $(el).find(".thumb img").attr("src") || "";
      const href = anchor.attr("href") || "";

      if (title && href) {
        results.push({
          id: href,
          title: title,
          cover: cover,
          type: "anime",
        });
      }
    });

    return results;
  },

  async search(query, page = 1) {
    try {
      const targetUrl = this.metadata.baseUrl + "/?s=" + encodeURIComponent(query) + "&post_type=anime";
      const html = await bridge.fetchText(targetUrl);
      const $ = bridge.parseHTML(html);

      const results = [];

      $("ul.chivsrc li").each((_, el) => {
        const anchor = $(el).find("h2 a").first();
        const title = anchor.text().trim();
        const href = anchor.attr("href") || anchor.attr("title") || "";
        const cover = $(el).find("img").attr("src") || "";

        let genres = [];
        let status = "";
        let rating = "";

        $(el).find(".set").each((_, setEl) => {
          const text = $(setEl).text().trim();
          if (text.includes("Genre") || text.includes("Genres")) {
            $(setEl).find("a").each((_, gAnchor) => {
              genres.push($(gAnchor).text().trim());
            });
          } else if (text.includes("Status")) {
            status = text.replace("Status", "").replace(":", "").trim();
          } else if (text.includes("Rating")) {
            rating = text.replace("Rating", "").replace(":", "").trim();
          }
        });

        if (title && href) {
          results.push({
            id: href,
            title: title,
            cover: cover || "https://via.placeholder.com/150",
            genres: genres.length ? genres : [ "N/A" ],
            status: status || "N/A",
            rating: rating || "N/A",
            type: "anime",
          });
        }
      });

      return results;
    } catch (error) {
      console.error(`[${this.metadata.id}] Error search:`, error);
      return [];
    }
  },

  async getDetail(itemUrl) {
    const html = await bridge.fetchText(itemUrl);
    const $ = bridge.parseHTML(html);

    const title = $(".jjudul").text().trim() || $(".fotoanime .infozin .infozings p").first().text().replace("Judul:", "").trim();
    const cover = $(".fotoanime img").attr("src") || "";
    const synopsis = $(".sinopsc").text().trim();

    const info = {};
    $(".fotoanime .infozin .infozings p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.includes(":")) {
        const parts = text.split(":");
        const key = parts[ 0 ].trim().toLowerCase().replace(" ", "_");
        const value = parts.slice(1).join(":").trim();
        if (key && value) {
          info[ key ] = value;
        }
      }
    });

    const genres = [];
    $(".fotoanime .infozin .infozings p").each((_, el) => {
      const text = $(el).text().trim();
      if (text.toLowerCase().includes("genre")) {
        $(el).find("a").each((_, gEl) => {
          genres.push($(gEl).text().trim());
        });
      }
    });

    const episodes = [];
    $(".episodelist ul li").each((_, el) => {
      const anchor = $(el).find("a").first();
      if (anchor.length) {
        episodes.push({
          name: anchor.text().trim(),
          url: anchor.attr("href") || "",
          uploadDate: $(el).find(".zee-release-date").text().trim(),
        });
      }
    });

    return {
      title,
      cover,
      synopsis,
      info,
      genres,
      episodes,
    };
  },

  async getStreamSources(episodeUrl) {
    const html = await bridge.fetchText(episodeUrl);
    const $ = bridge.parseHTML(html);

    const sources = [];

    // 1. Server Default (Desustream)
    const defaultIframe = $(".responsive-embed iframe").attr("src") || $("iframe").attr("src") || "";
    if (defaultIframe) {
      sources.push({
        server: "Default (Desustream)",
        quality: "Auto",
        url: defaultIframe,
        isHls: defaultIframe.includes(".m3u8"),
        headers: {
          Referer: this.metadata.baseUrl,
        },
      });
    }

    // 2. Mirror Servers (360p, 480p, 720p)
    const qualities = [ "360p", "480p", "720p" ];

    for (const q of qualities) {
      const items = $(".mirrorstream ul.m" + q + " li");
      for (let i = 0; i < items.length; i++) {
        const el = items[ i ];
        const anchor = $(el).find("a");
        const serverName = anchor.text().trim() || $(el).text().trim();
        const dataContent = anchor.attr("data-content") || "";

        if (serverName && dataContent) {
          // Buka data-content menjadi URL iframe asli
          const resolvedUrl = await this.resolveStreamUrl(dataContent);

          sources.push({
            server: serverName,
            quality: q,
            url: resolvedUrl || "",
            dataContent: dataContent,
            headers: {
              Referer: this.metadata.baseUrl,
            },
          });
        }
      }
    }

    return sources;
  },

  // Helper untuk menukar data-content ke URL iframe embed asli via AJAX
  async resolveStreamUrl(dataContent) {
    try {
      // Decode base64 payload jika berbentuk JSON string
      const payload = JSON.parse(atob(dataContent));

      const formData = new URLSearchParams();
      for (const key in payload) {
        formData.append(key, payload[ key ]);
      }

      // Request POST ke endpoint AJAX Otakudesu
      const resText = await bridge.fetchText(this.metadata.baseUrl + "/wp-admin/admin-ajax.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
        },
        body: formData.toString(),
      });

      const $ = bridge.parseHTML(resText);
      const iframeSrc = $("iframe").attr("src") || "";
      return iframeSrc;
    } catch (e) {
      return "";
    }
  },

};

module.exports = Otakudesu;
