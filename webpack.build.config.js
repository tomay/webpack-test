const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  // Set the mode to development or production
  mode: 'production',
  devtool: 'source-map',
  
  module: {
    rules: [
      {
        test: /\.(scss|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 2,
              sourceMap: false,
              modules: true,
            },
          },
          'sass-loader',
        ],
      },
    ],
  },

  // Customize the webpack build process
  plugins: [
    // Extracts CSS into separate files
    // Note: style-loader is for development, MiniCssExtractPlugin is for production
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
      chunkFilename: '[id].css',
    }),

    // copy the listed things from entry to output
    new CopyWebpackPlugin({
      patterns: [
        { from: 'static/', to: 'static/' },
        { from: 'data/', to: 'data/' },
      ]
    })
  ]
});