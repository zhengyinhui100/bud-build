/**!
 *
 * Copyright(c) Alibaba Group Holding Limited.
 *
 *
 * date: 2017-2-9
 */

'use strict';

const shell = require("shelljs");
require('shelljs/global');
const colors = require( "colors");
const co = require('co');
const webpack = require("webpack");
const config = require('./lib/config.js');

exports.watch=function(options){
  let conf = config.config(options);
  var compiler = webpack(conf);
  compiler.watch({
    aggregateTimeout: 300, // wait so long for more changes
    ignored: /node_modules/,
    // poll: true // use polling instead of native watchers
  }, function(err, stats) {

    if (err) {
      console.error(err.stack || err);
      if (err.details) {
        console.error(err.details);
      }
      return;
    }

    const info = stats.toJson();

    if (stats.hasErrors()) {
      console.error(info.errors);
      console.error(stats.compilation.errors);
    }

    if (stats.hasWarnings()) {
      console.warn(info.warnings);
    }

    console.info('stats:',stats.toString("minimal"));

  });
}

exports.build=function(options){
  let conf = config.config(options);
  webpack(conf, (err, stats) => {
    if (err) {
      console.error(err.red);
      console.error(stats);
      process.exit(1);
    }else if(stats.hasErrors()){
      console.error('build error:'.red)
      console.error(stats.compilation.errors);
      process.exit(1);
    }else{
      console.log('webpack build success !'.green)
      if(options.online){
        // co(OSS.upload()).catch(function(err){
        //   console.error(err);
        //   process.exit(1);
        // });
      }
    }
  });
}

