module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    "googleappsscript/googleappsscript": true,
  },
  plugins: ["googleappsscript"],
  extends: ["standard-with-typescript", "prettier"],
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {},
};
