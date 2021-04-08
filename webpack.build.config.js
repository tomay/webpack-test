const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');


module.exports = {

  // Set the mode to development or production
  mode: 'production',

  // Where webpack looks to start building the bundle
  entry: {
    app: [path.resolve(__dirname, './src/index.js')],
  },

  // Where webpack outputs the assets and bundles
  output: {
    path: path.resolve(__dirname, 'docs'),
    filename: '[name].[contenthash].js',
    // publicPath: '/',
  },

  module: {
    rules: [
      {
        // use babel to transpile JavaScript
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        // use webpack default loader to copy image files to build folder
        test: /\.(jpe?g|png|gif|svg)$/,
        type: 'asset',
        parser: { dataUrlCondition: { maxSize: 15000 } },
      },
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
    // Removes/cleans build folders and unused assets when rebuilding
    new CleanWebpackPlugin(),

    // load index.html and inject sources to it as script tags
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html')
    }),

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
}