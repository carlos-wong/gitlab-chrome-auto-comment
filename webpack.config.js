const path = require('path');

module.exports = {
  devtool: 'cheap-module-source-map',
  entry:{
    main:'./contentScript.js',
    hotreload:"./hot-reload.js"
  },
  output: {
    filename: '[name].js',
    path: path.resolve('./', 'dist')
  }
};
