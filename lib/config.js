/**!
 *
 * Copyright(c) Alibaba Group Holding Limited.
 *
 *
 * date: 2016-11-1
 */

'use strict';
const webpack = require('webpack');
const path=require('path');
const autoprefixer=require('autoprefixer');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const AssetsPlugin = require('assets-webpack-plugin');
const WebpackMd5Hash = require('webpack-md5-hash');
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const AutoDllPlugin = require('autodll-webpack-plugin');
const fs = require('fs');
const colors = require( "colors");
const entry = require( "./entry.js");
const HappyPack = require('happypack');
const os = require('os');
const happyThreadPool = HappyPack.ThreadPool({ size: os.cpus().length });


colors.setTheme({
  tips: ['blue', 'underline']
});



exports.config = function(options) {

  console.log('=====webpack start=====');

  let budConf = {};

  try{
    console.log(path.resolve('bud.config.js'))
    budConf = require(path.resolve('bud.config.js'));
    console.log( 'budConf:',budConf );
  }catch(e){
    console.log('missing bud.config.js');
  }
  let buildConf = budConf.build && budConf.build.webpack || {};

  let hash='';
  let chunkhash='';
  let contenthash='';
  let buildInfo={};
  const pkgInfo=require(path.resolve('./package.json'));

  //打包线上版本
  const isOnline = options.online;
  if( isOnline ){
    buildInfo.env='online';
    options.p=true;
    console.log("build online!!".tips);
  }

  //打包新的带chunkhash的文件
  //chunkhash和contenthash见：http://www.cnblogs.com/ihardcoder/p/5623411.html
  if(options.p || isOnline){
    buildInfo.p=true;
    hash='.[hash:8]';
    //chunkhash有问题，猜测可能是修改了某个文件，common文件也会改变内容，而实际构建使用的chunkhash值又没有改变，导致出错，所以暂时使用hash
    // chunkhash='.[chunkhash]';
    chunkhash = '.[hash:8]';
    contenthash = '.[contenthash]';
    console.log("build with hash!!".tips);
  }

  let distDirName = options.p ? 'p' : 'd';
  let outputDir = buildConf.outputDir || ('app/public/' + distDirName );
  let publicPath = buildConf.publicPath || ( '/public/' + distDirName +'/' );
  let cdnPublicPath = buildConf.cdnPublicPath || '//img.ucdl.pp.uc.cn/upload_files/'+pkgInfo.name.replace(/.+\//,'').replace(/-/g,'_')+publicPath;;


  //publicPath是cdn的地址
  if(options.cdn || isOnline){
    buildInfo.cdn = true;
    publicPath = cdnPublicPath;
    console.log(("build with cdn publicPath:"+publicPath).tips);
  }else{
    console.log("build with self domain publicPath!!".tips)
  }

  if(options.p) {
    console.log('build compress!'.tips);
  }


  //将打包信息写入配置，提供给publish.js读取
  fs.writeFileSync(path.resolve('./config/build.info.json'), JSON.stringify(buildInfo,null, 4));


  let config;

  // antd项目
  const budType = budConf.type || '';
  const isReact = budType.indexOf( 'react' ) > -1;
  const isAntd = budType.indexOf( 'antd' ) > -1;
  if( isReact || isAntd ){

    // 读取 antd 主题配置
    let theme = {};
    let entry ={};
    let importLib = [];
    if(isAntd){
      if (pkgInfo.theme && typeof (pkgInfo.theme) === 'string') {
        // "theme": "./theme.js"
        const getThemeConfig = require(path.resolve( pkgInfo.theme ));
        theme = getThemeConfig();
      } else if (pkgInfo.theme && typeof (pkgInfo.theme) === 'object') {
        // "theme": { "primary-color": "#1DA57A" }
        theme = pkgInfo.theme;
      }

      if( budType.indexOf( 'antd-pc' ) > -1 ){
        entry['home'] = './src/index.js';
        importLib.push([
          "import",
          {
            "libraryName": "antd",
            "style": true
          },
          "antd"
        ]);
      }
      if( budType.indexOf( 'antd-mobile' ) > -1 ){
        entry['mhome'] = './src/mIndex.js';
        importLib.push([
          "import",
          {
            "libraryName": "antd-mobile",
            "style": true
          },
          "ant-mobile"
        ]);
      }
    }else{
      entry['home'] = './src/index.js';
    }


    config = {
      mode: options.p ? 'production' : 'development',
      entry: entry,
      output: {
        path: path.resolve(outputDir),
        publicPath: publicPath,
        filename: '[name]' + chunkhash + '.js',
        chunkFilename: '[name][id].chunk'+chunkhash+'.js'
      },
      plugins: [
        new CleanWebpackPlugin([ outputDir ], {
          root:path.resolve('./')
        }),
        // new HappyPack({
        //   //用id来标识 happypack处理那里类文件
        //   id: 'happyBabel',
        //   //如何处理  用法和loader 的配置一样
        //   loaders: [{
        //     loader: 'babel-loader',
        //     options: {
        //       cacheDirectory: true,
        //       babelrc: false,
        //       presets: [
        //         '@babel/preset-env',
        //         '@babel/preset-react'
        //       ],
        //       plugins: [
        //         [
        //           "import",
        //           {
        //             "libraryName": "antd",
        //             "style": true
        //           }
        //         ],
        //         [
        //           "@babel/plugin-proposal-decorators",
        //           {
        //             "legacy": true
        //           }
        //         ],
        //         "@babel/plugin-transform-runtime",
        //         "@babel/plugin-syntax-dynamic-import",
        //         "@babel/plugin-proposal-class-properties"
        //       ]
        //     }
        //   }],
        //   //共享进程池
        //   threadPool: happyThreadPool,
        //   //允许 HappyPack 输出日志
        //   verbose: true,
        // }),
        new webpack.LoaderOptionsPlugin({
          // minimize: true,
          options: {
            postcss: [
              autoprefixer({
                overrideBrowserslist: [
                  'last 2 versions',
                  'ie >= 8',
                  'iOS >= 6',
                  'Android >= 4'
                ]
              })
            ]
          }
        }),
        new MiniCssExtractPlugin({
          filename: "[name]" + hash + ".css",
          chunkFilename: "[id]" + hash + ".css"
        }),
        new FilterWarningsPlugin({
          exclude: /mini-css-extract-plugin[^]*Conflicting order between:/
        }),
        new AssetsPlugin({
          prettyPrint: true,
          update: false,
          path: path.resolve('config'),
        })
      ],
      resolve: {
        // require时省略的扩展名，如：require('module') 不需要module.js
        extensions: ['.js', '.less'],
        // 别名
        alias: {
          src: path.resolve('./src'),
          assets: path.resolve('./src/assets'),
          routes: path.resolve('./src/routes'),
          store: path.resolve('./src/store'),
          utils: path.resolve('./src/utils'),
          components: path.resolve('./src/components')
        }
      },
      // 处理不同后缀的文件
      module: {
        rules: [{
          test: /\.js$/,
          exclude: /node_modules/,
          // 将对.js文件的处理转交给id为babel的HappyPack的实列
          // use: ['happypack/loader?id=happyBabel']
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            babelrc: false,
            presets: [
              '@babel/preset-env',
              '@babel/preset-react'
            ],
            plugins: importLib.concat([
              [
                "@babel/plugin-proposal-decorators",
                {
                  "legacy": true
                }
              ],
              "@babel/plugin-transform-runtime",
              "@babel/plugin-syntax-dynamic-import",
              "@babel/plugin-proposal-class-properties"
            ])
          }
        },
          {
            test: /\.(less|css)$/,
            exclude: path.resolve('./node_modules'),
            use: [
              MiniCssExtractPlugin.loader,
              'css-loader?modules&localIdentName=[local]___[hash:base64:5]',
              {
                loader: 'postcss-loader',
                options: {
                  // 如果没有options这个选项将会报错 No PostCSS Config found
                  plugins: (loader) => [
                    require('autoprefixer')() //CSS浏览器兼容
                  ]
                }
              },
              {
                loader: 'less-loader',
                options: {
                  sourceMap: true,
                  javascriptEnabled: true,
                  modifyVars: theme
                }
              }
            ]
          }, {
            test: /\.(less|css)$/,
            include: path.resolve('./node_modules'),
            use: [
              MiniCssExtractPlugin.loader,
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  // 如果没有options这个选项将会报错 No PostCSS Config found
                  plugins: (loader) => [
                    require('autoprefixer')() //CSS浏览器兼容
                  ]
                }
              },
              {
                loader: 'less-loader',
                options: {
                  sourceMap: true,
                  javascriptEnabled: true,
                  modifyVars: theme
                }
              }
            ]
          },
          {
            test: /\.(png|jpe?g|gif)(\?.*)?$/,
            loader: 'url-loader',
            options: {
              limit: 10000,
              name: `[name]${hash}.[ext]`
            }
          },
          {
            test: /\.svg(\?\S*)?$/,
            loader: 'file-loader',
            options: {
              minetype: 'image/svg+xml',
              name: `[name]${hash}.[ext]`
            }
          },
          {
            test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
            loader: 'file-loader',
            options: {
              limit: 10000,
              name: `[name]${hash}.[ext]`
            }
          }]
      }
    }
  }else{
    // 普通bud项目
    config = {
      mode: isOnline ? 'production' : 'development',
      entry: entry.get(),
      output: {
        path: path.resolve(outputDir),
        publicPath: publicPath,
        filename: '[name]' + chunkhash + '.js',
        chunkFilename: '[id].chunk'+chunkhash+'.js'
      },
      module: {
        rules: [{
          enforce:"pre",
          test: /\.js$/,
          loader: "eslint-loader",
          exclude: /node_modules/
        },{
          test: /\.vue$/,
          loader: 'vue-loader'
        }, {
          test: /\.js$/,
          use:[{
            loader: 'babel-loader',
            options: {
              presets: [['@babel/preset-env', { modules: 'umd' }]],
              plugins: ['@babel/transform-runtime'],
              cacheDirectory: true
            },
          }],
          exclude: /node_modules/
        }, {
          test: /\.(png|jpg|jpeg|ico|gif|woff|svg|eot|ttf)$/,
          use:[{
            loader: 'url-loader',
            options:{
              limit:20480,
              name:'img/[name]' + hash + '.[ext]'
            }
          }]
        },
          {
            test:/\.(css|less)$/,
            // exclude: /node_modules/,
            // use:['style-loader','css-loader','less-loader'] // 编译顺序从右往左
            // 分离编译后的css
            use:[
              MiniCssExtractPlugin.loader,
              'css-loader',
              {
                loader: 'postcss-loader',
                options: {
                  // 如果没有options这个选项将会报错 No PostCSS Config found
                  plugins: (loader) => [
                    require('autoprefixer')() //CSS浏览器兼容
                  ]
                }
              },
              'less-loader'
            ]
          }]
      },
      //imageWebpackLoader: {
      //	mozjpeg: {
      //		quality: 65
      //	},
      //	pngquant: {
      //		quality: "65-95",
      //		speed: 4
      //	}
      //},
      //postcss: [autoprefixer({
      //	browsers: [
      //		'last 2 versions',
      //		'ie >= 9'
      //	]
      //})],
      plugins: [
        new CleanWebpackPlugin([ outputDir ], {
          root:path.resolve('./')
        }),
        new webpack.LoaderOptionsPlugin({
          options: {
            postcss: function(){
              return [
                autoprefixer({
                  browsers: [
                    'last 2 versions',
                    'ie >= 9'
                  ]
                })
              ]
            }
          }
        }),
        // new webpack.optimize.CommonsChunkPlugin({name:'common', filename:'common'+hash+'.js'}),
        new WebpackMd5Hash(),
        // new ExtractTextPlugin({filename:'[name]' + '.css', allChunks: true}), // 单独打包CSS
        //new CopyWebpackPlugin([
        //	{from: path.resolve('./src/common/img/favicon.ico'), to: path.resolve('common/img/favicon.ico')}
        //]),
        new MiniCssExtractPlugin({
          filename: "[name]" + hash + ".css",
          chunkFilename: "[id]" + hash + ".css"
        }),
        new AssetsPlugin({
          prettyPrint: true,
          update: false,
          path: path.resolve('config')
        })
      ],

      optimization: {
        // splitChunks: {
        //     chunks: "initial"
        // },
        // splitChunks: {
        //   cacheGroups: {
        //     vendor: {
        //       test: /[\\/]node_modules[\\/]/,
        //       name: 'common',
        //       filename:'common' + hash + '.js',
        //       chunks: 'all'
        //     }
        //   }
        // },
        minimizer: [
          new UglifyJsPlugin({
            cache: true,
            parallel: true,
            sourceMap: true // set to true if you want JS source maps
          }),
          new OptimizeCSSAssetsPlugin({})
        ]
      },

      resolve: {
        alias: {
          common: path.resolve('./app/view/common'),
          lib: path.resolve('./app/view/lib'),
          view: path.resolve('./app/view')
        }
        //modules:[path.resolve(__dirname, "../node_modules")]
      }
      // resolveLoader:{
      //   modules:[path.resolve(__dirname, "../node_modules")]
      // }
    }
  };

  if ( options.a ) {
    const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
    config.plugins.push(new BundleAnalyzerPlugin());
    config.plugins.push(new webpack.ProgressPlugin({
      profile: true
    }));
  }

  if( !options.p && budConf.webpack && budConf.webpack.autoDll ){
    config.plugins.unshift(new AutoDllPlugin({
      filename: 'vendor.js',
      inherit: true,
      plugins: [
        new MiniCssExtractPlugin({
          filename: 'vendor.css',
          chunkFilename: 'vendor[id]' + hash + '.css',
        }),
      ],
      entry: {
        vendor: [ './src/vendor.js' ],
      },
    }));
  }


  if ( budConf.webpack && budConf.webpack.after ){
    config = budConf.webpack.after( config, options );
  }


  return config;
}
