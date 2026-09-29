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

  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith(".js"));

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const content = fs.readFileSync(filePath, "utf-8");

    // Regex ekstraksi metadata dari file .js
    const idMatch = content.match(/id:\s*["']([^"']+)["']/);
    const nameMatch = content.match(/name:\s*["']([^"']+)["']/);
    const versionMatch = content.match(/version:\s*["']([^"']+)["']/);
    const langMatch = content.match(/lang:\s*["']([^"']+)["']/);
    const nsfwMatch = content.match(/isNsfw:\s*(true|false)/);

    if (idMatch && nameMatch) {
      const id = idMatch[ 1 ];
      const name = nameMatch[ 1 ];
      const version = versionMatch ? versionMatch[ 1 ] : "1.0.0";
      const lang = langMatch ? langMatch[ 1 ] : "id";
      const isNsfw = nsfwMatch ? nsfwMatch[ 1 ] === "true" : false;

      extensions.push({
        id,
        name,
        version,
        type,
        lang,
        isNsfw,
        icon: `${BASE_RAW_URL}/icons/${id}.png`,
        scriptUrl: `${BASE_RAW_URL}/${type}/${file}`,
      });
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
