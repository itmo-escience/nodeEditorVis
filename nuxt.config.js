const routerBase = process.env.DEPLOY_ENV === 'GH_PAGES' ? {
  router: {
    base: '/nodeEditorVis/'
  }
} : {}
const prefix = process.env.DEPLOY_ENV === 'GH_PAGES' ? {
  axios: {
    baseURL: 'https://itmo-escience.github.io/nodeEditorVis/'
  }
} : {}
module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'WebWis',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Nuxt.js project' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/logo.svg' }
    ]
  },
  modules: [
    '@nuxtjs/axios'
  ],
  ...prefix,
  ...routerBase,

  mode: 'spa',
  runtimeCompiler: true,
  
  build: {
    extend (config, { isDev, isClient }) {
      if (isDev && isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/
        })
      }
    }
  }
}

