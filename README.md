# Gatsby Plugin: Embedded Netlify CMS

This Gatsby plugin is an alternative to `gatsby-plugin-netlify-cms`,
implementing it within the Gatsby site instead of an external Webpack config;
this way, you can use a page query to provide data to your Netlify CMS instance!

## Plugin Options

### publicPath: String = "admin"

Like `plugin-netlify-cms`, this option specifies where `createPage` will be
called to make Netlify CMS's entry point. If set to a falsy value, this plugin
won't call `createPage`.

### htmlTitle: String = "Content Manager"

This string is provided through `context` to the entry point `createPage`, which
with the default component plugs it `react-helmet` to set the page's title.

### htmlFavicon: String = null

This string is passed through `context` into the entry point's head, like
`htmlTitle`. Notably, it's just a static string so generally this would point to
a file in your Gatsby site's `/static` folder, relative to that folder (I.E. a
favicon in `static/favicon.png` would use `/favicon.png`)

### faviconType: String

This is the `type` attribute given to the favicon's `link` element. If not
specified, the plugin will attempt to infer the correct one depending on
`htmlFavicon`'s extension (`image/x-icon` for .ico, `image/ico` for anything
else).

### buildConfig: async Function(gatsby: Object, options: Object)

This special function is used to build the config used in Netlify CMS. It's
executed in the `createPages` lifecycle and given the same arguments- though
it's worth noting the `options` passed in are after the plugin's default options
are provided.

The value returned from this function is set as the `config` key in the entry
point's page context, which is then passed directly into Netlify CMS as config.

## Shadowable files

### configure-cms.js

The function exported by this module is called in the default CMS page component
once the CMS is loaded and available, and is the point where things like custom
widgets should be added to the CMS.

The function is given an object with the following shape:

```javascript
{
  CMS, // The Netlify CMS library object,
  data, // The result of the CMS Page's page query
  pageContext, // The context passed to this page from createPage
  config // The configuration generated by create-config
}
```

You may also import and call the original module to take advantage of the File
System Backend in development mode, like so:

```javascript
import originalConfigurator from "gatsby-plugin-embedded-netlify-cms/src/configure-cms"
import MyWidget from "../components/myWidget"

export default ({ CMS, config }) => {
  originalConfigurator({ CMS, config })
  CMS.registerWidget("my-widget", myWidget)
}
```

Take note that the `config` object here is what's passed into the CMS, so
modifying it will modify config options. The default implementation takes
advantage of this to override the previous configuration to use the File System
backend.

### cms-page.js

This module exports a component that sets up Netlify CMS with the Webpack config
this plugin uses, meant to be called with `createPage`. The original can also be
imported by shadows to use this same functionality with a custom page query.

It's generally best to avoid shadowing this and stick to `buildConfig` and
`configure-cms` for your configuration, but the possibility is here if you need
it.

## How to Use

### Build Config

First, you need to make your `buildConfig` function and pass it to the plugin in
`gatsby-config`. In this function, you can access all of the arguments Gatsby
provides to `createPages`- most importantly, the `graphql` function.

Unlike the one in components, this is the build-time `graphql` function. It's
invoked with parentheses and can take query arguments.

Here's an example as to what I'm getting at:

```javascript
const buildConfig = async ({graphql}) => {
  const {data, errors} = await graphql(`
    {
      [... your GraphQL query]
    }
  `)
  
  if(errors) throw errors;
  
  const processedData = processData(data)
  
  return {
    backend: {
      name: "git-gateway",
      branch: "master",
    },
    load_config_file: false,
    media_folder: "static/uploads",
    public_folder: "/uploads",
    collections: [
      {
        label: "Pages",
        label_singular: "page",
        name: "pages",
        folder: "content",
        extension: "mdx",
        format: "yaml-frontmatter",
        create: true,
        fields: [
          { 
            label: "Category", 
            name: "category", 
            widget: "select", 
            options: processedData.categories
          }
        ],
      },
    ],
  }
}
```

GraphQL is optional, of course; you can easily just return a static
configuration or something based on `options` if that's all you need.

### Configure CMS

While configuration can easily be done at build time, there's a few things in
Netlify CMS, such as custom widgets and backends, that use the imported CMS and
other live objects which aren't so easily done at build time. For these, you can
shadow the `configure-cms.js` module!

reprising the example up above: 

```javascript
import originalConfigurator from "gatsby-plugin-embedded-netlify-cms/src/configure-cms"
import MyWidget from "../components/myWidget"

export default ({ CMS, config }) => {
  originalConfigurator({ CMS, config })
  CMS.registerWidget("my-widget", myWidget)
}
```

It's that simple!  
You can also leave out the "originalConfigurator" but if you'd like, it sets up
the File System backend in development mode and overrides configuration
accordingly.
