const webpack = require('webpack')
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {

  // Set the mode to development or production
  mode: 'development',

  // Control how source maps are generated
  devtool: 'inline-source-map',

  // build to a folder named docs instead of the default 'dist'
  output: {
    path: path.resolve(__dirname, 'docs')
  },

  module: {
    rules: [
      {
        // Styles: Inject CSS into the head with source maps
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      },
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
    ]
  },


  // load index.html and inject sources to it as script tags
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html')
    }), 
   // Only update what has changed on hot reload
    new webpack.HotModuleReplacementPlugin(),
  ]
};