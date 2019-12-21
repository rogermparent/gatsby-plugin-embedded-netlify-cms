const path = require("path")
const CopyPlugin = require("copy-webpack-plugin")

exports.onCreateDevServer = ({ app }) => {
  const fsMiddlewareAPI = require('netlify-cms-backend-fs/dist/fs');
  fsMiddlewareAPI(app);
};

const withDefaults = (options) => {
  return({
    enableIdentityWidget: true,
    publicPath: `admin`,
    htmlTitle: `Content Manager`,
    htmlFavicon: ``,
    ...options
  })
}

exports.onCreateWebpackConfig = (
  { store, stage, getConfig, plugins, pathPrefix, loaders, rules, actions },
  pluginOptions
) => {

  const {
    enableIdentityWidget,
  } = withDefaults(pluginOptions)

  const gatsbyConfig = getConfig()
  const { program } = store.getState()

  const externals = [
    {
      name: `netlify-cms-app`,
      global: `NetlifyCmsApp`,
      assetDir: `dist`,
      assetName: `netlify-cms-app.js`,
      sourceMap: `netlify-cms-app.js.map`,
    },
  ]

  if (enableIdentityWidget) {
    externals.unshift({
      name: `netlify-identity-widget`,
      global: `netlifyIdentity`,
      assetDir: `build`,
      assetName: `netlify-identity-widget.js`,
      sourceMap: `netlify-identity-widget.js.map`,
    })
  }

  const webpackPlugins = [
    new CopyPlugin(
      [].concat.apply(
        [],
        externals.map(({ name, assetName, sourceMap, assetDir }) =>
          [
            {
              from: require.resolve(path.join(name, assetDir, assetName)),
              to: assetName,
            },
            sourceMap && {
              from: require.resolve(path.join(name, assetDir, sourceMap)),
              to: sourceMap,
            },
          ].filter(item => item)
        )
      )
    ),
  ]

  actions.setWebpackConfig({
    plugins: webpackPlugins,
    externals: externals.map(({ name, global }) => {
      return {
        [name]: global,
      }
    }),
    optimization:
      stage === `develop`
      ? {}
      : {
        splitChunks: {
          cacheGroups: {
            "netlify-identity-widget": {
              test: /[\\/]node_modules[\\/](netlify-identity-widget)[\\/]/,
              name: `netlify-identity-widget`,
              chunks: `all`,
              enforce: true,
            },
          },
        },
      },
  })
}

exports.createPages = ({actions: {createPage}}, pluginOptions) => {
  const {
    publicPath,
    htmlTitle,
    htmlFavicon
  } = withDefaults(pluginOptions)
  createPage({
    path: publicPath,
    component: require.resolve('./src/cms-page'),
    context: {
      htmlTitle,
      htmlFavicon
    }
  })
}
