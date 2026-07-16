const nunjucks = require("nunjucks");
const fs = require("fs");
const path = require("path");
const { defu } = require("defu");
const YAML = require("yaml");

const LANDO_FILE_PATH = path.resolve(
  __dirname,
  "./../../lando/nginx/custom.conf"
);
const DDEV_FILE_PATH = path.resolve(
  __dirname,
  "./../../.ddev/nginx_full/nginx-site.conf"
);
const DOCKER_FOLDER_PATH = path.resolve(
  __dirname,
  "./../../deploy/nginx"
);

/**
 * Load the yaml config from the file.
 */
function loadConfig(filePath) {
  const base = YAML.parse(fs.readFileSync(filePath).toString());
  return base;
}

/**
 * Generate the config for the local lando environment.
 */
function generateLocal(baseConfig) {
  const res = nunjucks.render("./templates/base.njk", baseConfig);

  // Ensure the directory exists before writing the file
  const landoDir = path.dirname(LANDO_FILE_PATH);

  if (!fs.existsSync(landoDir)) {
    fs.mkdirSync(landoDir, { recursive: true });
  }
  fs.writeFileSync(LANDO_FILE_PATH, res);
}

function generateDDEV(baseConfig) {
  const res = nunjucks.render("./templates/base.njk", baseConfig);

  // Ensure the directory exists before writing the file
  const landoDir = path.dirname(LANDO_FILE_PATH);

  if (!fs.existsSync(landoDir)) {
    fs.mkdirSync(landoDir, { recursive: true });
  }

  console.log("Generating config for DDEV");
  const overrides = loadConfig("./config/ddev.yml");
  const envConfig = defu(overrides, baseConfig);
  const compiled = nunjucks.render("./templates/base.njk", envConfig);

  fs.writeFileSync(DDEV_FILE_PATH, compiled);
}


/**
 * Generate the configs for each docker environment.
 */
function generateEnvs(baseConfig) {
  const envs = fs.readdirSync("./config/envs");
  console.log("Start generating files for environments: " + envs);

  envs.forEach((envConfigFile) => {
    console.log("Generating config for " + envConfigFile);
    const overrides = loadConfig("./config/envs/" + envConfigFile);
    const envConfig = defu(overrides, baseConfig);
    const compiled = nunjucks.render("./templates/base.njk", envConfig);
    const { name } = path.parse(envConfigFile);
    const destFile = path.join(DOCKER_FOLDER_PATH, name, name + ".conf");
    fs.writeFileSync(destFile, compiled);
  });
}

function main() {
  const baseConfig = loadConfig("./config/base.yml");
  generateLocal(baseConfig);
  generateDDEV(baseConfig);
  generateEnvs(baseConfig);
}

main();
