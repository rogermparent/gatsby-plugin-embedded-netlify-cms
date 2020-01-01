const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

exports.onCreateDevServer = ({ app }) => {
  const fsMiddlewareAPI = require("netlify-cms-backend-fs/dist/fs");
  fsMiddlewareAPI(app);
};

const getFaviconType = htmlFavicon => {
  const ext = path.extname(htmlFavicon);
  return ext === ".ico" ? "image/x-icon" : "image/ico";
};

const withDefaults = options => {
  const faviconType =
    options.faviconType ||
    (options.htmlFavicon && getFaviconType(options.htmlFavicon));

  return {
    enableIdentityWidget: false,
    publicPath: `admin`,
    htmlTitle: `Content Manager`,
    htmlFavicon: null,
    faviconType,
    ...options
  };
};

exports.onCreateWebpackConfig = (
  { store, stage, getConfig, plugins, pathPrefix, loaders, rules, actions },
  pluginOptions
) => {
  const gatsbyConfig = getConfig();
  const { program } = store.getState();

  const externals = [
    {
      name: `netlify-cms-app`,
      global: `NetlifyCmsApp`,
      assetDir: `dist`,
      assetName: `netlify-cms-app.js`,
      sourceMap: `netlify-cms-app.js.map`
    }
  ];

  const webpackPlugins = [
    new CopyPlugin(
      [].concat.apply(
        [],
        externals.map(({ name, assetName, sourceMap, assetDir }) =>
          [
            {
              from: require.resolve(path.join(name, assetDir, assetName)),
              to: assetName
            },
            sourceMap && {
              from: require.resolve(path.join(name, assetDir, sourceMap)),
              to: sourceMap
            }
          ].filter(item => item)
        )
      )
    )
  ];

  actions.setWebpackConfig({
    plugins: webpackPlugins,
    externals: externals.map(({ name, global }) => {
      return {
        [name]: global
      };
    })
  });
};

exports.createPages = async (gatsby, pluginOptions) => {
  const {
    actions: { createPage },
    graphql
  } = gatsby;
  const options = withDefaults(pluginOptions);
  if (options.publicPath) {
    const publicPath = path.join('/',options.publicPath,'/')
    const {
      htmlTitle,
      htmlFavicon,
      faviconType,
      getContextData
    } = options;
    const buildConfig = options.buildConfig || require("./src/build-config");
    const config = buildConfig(gatsby, options);

    createPage({
      path: publicPath,
      component: require.resolve("./src/cms-page"),
      context: {
        htmlTitle,
        htmlFavicon,
        config: await config
      }
    });
  }
};
