const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  // Оптимізація для production
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true
        },
        // Окремий чанк для React
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20
        },
        // Окремий чанк для UI бібліотек
        ui: {
          test: /[\\/]node_modules[\\/](styled-components|framer-motion|lucide-react)[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 15
        }
      }
    },
    // Мінімізація
    minimize: true,
    // Видалення мертвого коду
    usedExports: true,
    sideEffects: false
  },

  // Плагіни для оптимізації
  plugins: [
    // Аналіз розміру бандлу (тільки для аналізу)
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: 'bundle-report.html'
    }),
    
    // Стиснення файлів
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8
    })
  ].filter(Boolean),

  // Налаштування модулів
  module: {
    rules: [
      // Оптимізація зображень
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024 // 8KB
          }
        },
        generator: {
          filename: 'images/[name].[hash:8][ext]'
        }
      },
      
      // Оптимізація шрифтів
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name].[hash:8][ext]'
        }
      }
    ]
  },

  // Налаштування resolve для швидшого пошуку модулів
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@store': path.resolve(__dirname, 'src/store')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    // Пріоритет для node_modules
    modules: ['node_modules', path.resolve(__dirname, 'src')]
  },

  // Налаштування для development
  devtool: process.env.NODE_ENV === 'production' ? 'source-map' : 'eval-source-map',
  
  // Налаштування dev server
  devServer: {
    compress: true,
    hot: true,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/'
    }
  },

  // Налаштування для кешування
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename]
    }
  },

  // Налаштування для tree shaking
  mode: process.env.NODE_ENV || 'development',
  
  // Зовнішні залежності (для CDN)
  externals: process.env.NODE_ENV === 'production' ? {
    // Можна винести React в CDN для зменшення бандлу
    // 'react': 'React',
    // 'react-dom': 'ReactDOM'
  } : {}
};