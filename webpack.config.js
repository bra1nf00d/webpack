const path = require('path')

// PAGES
const PAGES = ['index.html']

// STATUS
const isDev = process.env.NODE_ENV === 'development',
  isProd = !isDev

// VARIABLE
const HTMLWebpackPlugin = require('html-webpack-plugin'),
  {CleanWebpackPlugin} = require('clean-webpack-plugin'),
  MiniCssExtractPlugin = require('mini-css-extract-plugin'),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  ImageMinWebpackPlugin = require('image-minimizer-webpack-plugin'),
  AutoPrefixer = require('autoprefixer'),
  MediaQuery = require('postcss-combine-media-query'),
  StyleLint = require('stylelint'),
  fs = require('fs')

// FUNCTION
const filename = ext => isDev
  ? `[name].${ext}`
  : `[name].[hash].${ext}`

const PATH = branch => {
  return path.resolve(__dirname, branch);
}

GitClean()

module.exports = {
  mode: 'development',
  entry: ['@babel/polyfill', PATH('./src/js/app.js')],
  output: {
    path: PATH('./app'),
    filename: `./js/${filename('js')}`,
  },
  // DEV SETTING
  devtool: isDev ? 'source-map' : false,
  devServer: {
    port: 3000,
    open: true,
    contentBase: PATH('app')
  },
  // OPTIMIZATION
  optimization: {
    splitChunks: {
      chunks: 'all'
    }
  },
  // MODULE
  module: {
    rules: [
      /* HTML */
      {
        test: /\.html$/,
        use: [{
          loader: 'html-loader',
          options: {
            interpolate: true
          }
        }]
      },
      /* CSS | SCSS */
      {
        test: /\.(s[ac]ss|css)$/,
        use: [
          {loader: MiniCssExtractPlugin.loader},
          {loader: 'css-loader'},
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  StyleLint({
                    fix: true
                  }),
                  MediaQuery(),
                  AutoPrefixer({
                    overrideBrowserslist: [
                      'ie >= 8',
                      'last 4 versions',
                    ],
                  })
                ],
              }
            }
          },
          {loader: 'sass-loader'}
        ]
      },
      /* JS */
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: JSOptions()
      },
      /* IMG */
      {
        test: /\.(?:png|jpg|jpeg|gif|svg)$/i,
        use: [
          {
            loader: ImageMinWebpackPlugin.loader,
          },
          {
            loader: 'file-loader',
            options: {
              name: `./img/${filename('[ext]')}`,
              esModule: false,
              publicPath: ''
            }
          }]
      },
      /* FONTS */
      {
        test: /\.(woff(2)?|eot|ttf|otf)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: `fonts/${filename('[ext]')}`,
            esModule: false,
            publicPath: '..'
          }
        }],
      },
    ]
  },
  // PLUGINS
  plugins: [
    new CleanWebpackPlugin(),
    ...PAGES.map(page => new HTMLWebpackPlugin(HTMLOption(page))),
    new MiniCssExtractPlugin({
      filename: `./css/${filename('css')}`
    }),
    new CopyWebpackPlugin({
      patterns: [{
        from: PATH('src/assets'),
        to: PATH('app'),
        globOptions: {
          ignore: [
            '**.png', '**.jpeg', '**.jpg',
            '**.gif', '**.svg', '**.ttf',
            '**.woff', '**.woff2', '**.otf',
            '**.eot'
          ]
        }
      }]
    }),
    new ImageMinWebpackPlugin({
      minimizerOptions: {
        plugins: [
          ['gifsicle', {interlaced: true}],
          ['jpegtran', {progressive: true}],
          ['optipng', {optimizationLevel: 5}],
          ['svgo', {plugins: [{removeViewBox: false,}]}]
        ]
      }
    })
  ],
}

// OPTIONS
function HTMLOption(page) {
  const config = {
    filename: page,
    template: PATH('./src/' + page),
    minify: {
      collapseWhitespace: isProd
    }
  }
  if (isProd) {
    fs.access('./app/favicon.ico', err => {
      if (!err) {
        config.favicon = PATH('./app/favicon.ico')
        console.log('FAVICON was added')
      }
    });
  }
  return config
}

function JSOptions() {
  const loaders = [{
    loader: 'babel-loader',
    options: {
      presets: [
        '@babel/preset-env'
      ],
      targets: '> 0.25%, not dead',
      plugins: [
        '@babel/plugin-proposal-class-properties'
      ]
    }
  }]
  if (isDev) {
    loaders.push('eslint-loader')
  }

  return loaders
}

function GitClean() {
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