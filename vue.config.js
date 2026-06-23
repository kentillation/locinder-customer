/* eslint-disable no-undef */
const { defineConfig } = require('@vue/cli-service');
const webpack = require('webpack');
module.exports = defineConfig({
  transpileDependencies: [],
  pluginOptions: {
    vuetify: {
      // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
    }
  },
  devServer: {
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_BASE_URL,
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    },
  },
  configureWebpack: {
    plugins: [
      new webpack.DefinePlugin({
        // Define the feature flag to eliminate the warning
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: JSON.stringify(false)
      })
    ]
  }
});