import reactRefresh from "@vitejs/plugin-react-refresh";
import fs from "fs";
import path from "path";

const packages = fs.readdirSync(path.resolve(__dirname, "../../packages"));
const aliases = packages.map((dirName) => {
  const packageJson = require(path.resolve(
    __dirname,
    "../../packages",
    dirName,
    "package.json"
  ));
  return {
    find: new RegExp(`^${packageJson.name}$`),
    replacement: path.resolve(
      __dirname,
      `../../packages/${packageJson.name}/src`
    ),
  };
}, {});

/**
 * https://vitejs.dev/config/
 * @type { import('vite').UserConfig }
 */
export default {
  plugins: [reactRefresh()],
  resolve: {
    alias: [
      ...aliases,
      {
        find: /^@mui\/icons-material\/(.*)/,
        replacement: "@mui/icons-material/esm/$1",
      },
    ],
  },
  server: {
    port: 5173,
    host: "0.0.0.0",
  },
  define: { "process.env": {} },
};
