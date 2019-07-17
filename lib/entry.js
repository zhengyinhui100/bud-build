/**!
 *
 * Copyright(c) Alibaba Group Holding Limited.
 *
 *
 * date: 2017-2-9
 */

'use strict';

const colors = require( "colors");
const path = require('path');
const fs = require('fs');


exports.get=function(){
  let viewDir= path.resolve('./app/view');
  let entry={};
  let files=fs.readdirSync(viewDir);
  //循环所有模块
  for(let file of files){
    if(file!='common' && file!='lib'){
      let modDir=viewDir+'/'+file;
      let stats=fs.lstatSync(modDir);
      if(stats.isDirectory()){
        let modFiles=fs.readdirSync(modDir);
        //循环模块内所有文件
        for(let modFile of modFiles) {
          //找到模板对应的js
          //if(modFile.endsWith('.art')){
          //  let modJsFile=modDir+'/'+modFile.replace(/art$/,'js');
          //  if(fs.existsSync(modJsFile)){
          //    let entryName=modFile==='view.art'?file:(file+'/'+modFile.replace(/.art$/,''));
          //    entry[entryName]=modJsFile;
          //  }
          //}
          if(modFile.endsWith('.js')){
            let modJsFile=modDir+'/'+modFile;
            let entryName=modFile==='view.js'?file:(file+'/'+modFile.replace(/.js$/,''));
            entry[entryName]=modJsFile;
          }
        }
      }
    }
  }
  console.log('entry:\n',entry);
  return entry;
};
