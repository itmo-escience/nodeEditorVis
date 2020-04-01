const routerBase = process.env.DEPLOY_ENV === 'GH_PAGES' ? {
  router: {
    base: '/nodeEditorVis/'
  }
} : {}
const prefix = process.env.DEPLOY_ENV === 'GH_PAGES' ? {
  axios: {
    prefix: '/nodeEditorVis/'
  }
} : {}
module.exports = {
  /*
  ** Headers of the page
  */
  head: {
    title: 'node-editor',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: 'Nuxt.js project' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  css: [
    '~/assets/css/main.css'
  ],
  modules: [
    '@nuxtjs/axios'
  ],
  /*
  router: {
    base: '/nodeEditorVis/dist/'
  },
  */
  ...prefix,
  ...routerBase,
  /*
  ** Customize the progress bar color
  */
  loading: { color: '#3B8070' },
  mode: 'spa',
  runtimeCompiler: true,
  /*
  ** Build configuration
  */
  build: {
    /*
    ** Run ESLint on save
    */
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

