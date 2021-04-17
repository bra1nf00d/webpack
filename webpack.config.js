const path = require('path')

const HTMLWebpackPlugin = require('html-webpack-plugin'),
  MiniCssExtractPlugin = require('mini-css-extract-plugin'),
  OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin'),
  UglifyJsPlugin = require('uglifyjs-webpack-plugin'),
  {CleanWebpackPlugin} = require('clean-webpack-plugin'),
  AutoPrefixer = require('autoprefixer'),
  MediaQuery = require('postcss-combine-media-query'),
  StyleLint = require('stylelint'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  ImageminPlugin = require('imagemin-webpack-plugin').default,
  SpeedMeasurePlugin = require("speed-measure-webpack-plugin"),
  { UnusedFilesWebpackPlugin } = require('unused-files-webpack-plugin'),
  fs = require('fs')

const isDev = process.env.NODE_ENV === 'development',
  isProd = !isDev

const pages = findHtml()

const smp = new SpeedMeasurePlugin()

Clean()
module.exports = smp.wrap({
  entry: ['@babel/polyfill', dir('./src/index.js')],
  output: {
    filename: `js/${filename('js')}`,
    path: dir('app')
  },
  /* WARNING */
  stats: {
    warnings: false
  },
  /* OPTIMIZATION */
  optimization: {
    splitChunks: {
      chunks: 'all'
    },
    minimizer: [
      new OptimizeCssAssetsPlugin({}),
      new UglifyJsPlugin({})
    ]
  },
  /* SOURCEMAP */
  devtool: isDev ? 'source-map' : false,
  /* SERVER */
  devServer: {
    port: 3000,
    open: true,
    contentBase: dir('app'),
  },
  /* PLUGINS */
  plugins: [
    new CleanWebpackPlugin(),
    ...pages.map(page => new HTMLWebpackPlugin(optiHtml(page))),
    new MiniCssExtractPlugin({
      filename: `css/${filename('css')}`
    }),
    new ImageminPlugin(),
    new UnusedFilesWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [{
        from: dir('src/assets'),
        to: dir('app'),
        globOptions: {
          ignore: [
            '**.png', '**.jpeg', '**.jpg',
            '**.gif', '**.svg', '**.ttf',
            '**.woff', '**.woff2', '**.otf',
            '**.eot'
          ]
        }
      }]
    })
  ],
  /* LOADERS */
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [{
          loader: 'html-loader',
          options: {
            interpolate: true,
            attrs: ['img:srcset', 'img:src']
          }
        }]
      },
      /* LESS */
      {
        test: /\.less$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']
      },
      /* CSS | SCSS */
      {
        test: /\.(s[ac]ss|css)$/,
        use: [
          {loader: MiniCssExtractPlugin.loader, options: {publicPath: '../'} },
          {loader: 'css-loader'},
          {loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  StyleLint({
                    fix: true,
                  }),
                  MediaQuery(),
                  AutoPrefixer({
                    overrideBrowserslist: [
                      'ie >= 8',
                      'last 4 versions',
                    ],
                  })
                ],
              },
            },
          },
          {loader: 'sass-loader'},
        ]
      },
      /* JS */
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
      /* IMG */
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: `img/${filename('[ext]')}`,
              esModule: false,
              publicPath: ''
            }
          }
        ],
      },
      /* FONTS */
      {
        test: /\.(woff(2)?|eot|ttf|otf)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: `fonts/${filename('[ext]')}`,
            esModule: false,
            publicPath: '../'
          }
        }]
      }
    ]
  }
})

/* FUNCTIONS */

function dir(branch) {
  return path.resolve(__dirname, branch)
}

function filename(ext) {
  if (isDev)
    return `[name].${ext}`
  else
    return `[name].[hash].${ext}`
}

function findHtml() {
  let pages = []

  let files = fs.readdirSync(dir('src')),
    separator = null,
    format = null

  for (let i = 0; i < files.length; i++) {
    separator = files[i][0]
    format = files[i].split('.')[1]

    if (separator !== '_' && format === 'html')
      pages.push(files[i])
  }

  return pages
}

function optiHtml(page) {
  let config = {
    filename: page,
    template: dir('./src/' + page),
    minify: {
      collapseWhitespace: isProd
    }
  }

  return config
}

function Clean() {
  if(fs.existsSync('./src/assets/fonts/.gitignore')) {
    fs.unlink('./src/assets/fonts/.gitignore', err => {
      if(err) throw err
    })
  }
  if(fs.existsSync('./src/assets/img/.gitignore')) {
    fs.unlink('./src/assets/img/.gitignore', err => {
      if(err) throw err
    })
  }
}