const react = require("@vitejs/plugin-react");

module.exports = {
  plugins: [react.default()],
  server: {
    host: "127.0.0.1",
    fs: {
      strict: true,
      allow: ["."]
    }
  }
};
