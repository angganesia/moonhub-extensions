const fs = require("fs");
const path = require("path");

const REPO_OWNER = "angganesia";
const REPO_NAME = "moonhub-extensions";
const BRANCH = "main";
const BASE_RAW_URL = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;

const categories = [ "anime", "manga" ];
const extensions = [];

categories.forEach((type) => {
  const dirPath = path.join(__dirname, "..", type);
  if (!fs.existsSync(dirPath)) return;

  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith(".json"));

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);

    try {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const jsonData = JSON.parse(fileContent);

      const metadata = jsonData.metadata || {};
      const id = metadata.id;
      const name = metadata.name;
      const baseUrl = metadata.baseUrl || "";
      const version = metadata.version || "1.0.0";
      const lang = metadata.lang || "id";
      const isNsfw = metadata.isNsfw === true;

      if (id && name) {
        const localIconPath = path.join(__dirname, "..", "icons", `${id}.png`);
        let iconUrl = "";

        if (fs.existsSync(localIconPath)) {
          iconUrl = `${BASE_RAW_URL}/icons/${id}.png`;
        } else if (baseUrl) {
          const domain = baseUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
          iconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        }

        extensions.push({
          id,
          name,
          version,
          type,
          lang,
          isNsfw,
          icon: iconUrl,
          scriptUrl: `${BASE_RAW_URL}/${type}/${file}`,
        });
      }
    } catch (error) {
      console.error(`❌ Gagal mem-parse file ${file}:`, error.message);
    }
  });
});

const indexData = {
  name: "MoonHub Official Extensions Repository",
  updatedAt: new Date().toISOString(),
  version: "1.0.0",
  extensions,
};

fs.writeFileSync(
  path.join(__dirname, "..", "index.json"),
  JSON.stringify(indexData, null, 2)
);

console.log(`\n✅ Berhasil! index.json diperbarui dengan ${extensions.length} ekstensi.\n`);
