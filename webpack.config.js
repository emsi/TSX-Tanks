const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  entry: './src/App.tsx',
  target: 'electron-renderer',
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader'
        },
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'index.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html'
    }),
  ],
};