import Vue from 'vue'
import HighchartsVue from 'highcharts-vue'
import Highcharts from 'highcharts'
import annotations from 'highcharts/modules/annotations'
import drilldown from 'highcharts/modules/drilldown'
import VuetifyConfirm from 'vuetify-confirm'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import GlobalMixin from './mixins/globalMixin'
import UserService from './services/user'

// Add global mixin and filters to Vue
Vue.mixin(GlobalMixin)
// Vue.prototype.$filters = Vue.options.filters

Vue.config.productionTip = false

// Initialize vuetify-confirm
Vue.use(VuetifyConfirm, {
    vuetify,
    buttonTrueText: 'OK',
    buttonFalseText: 'Cancel',
    color: 'warning',
    icon: 'mdi-warning',
    width: 350,
    property: '$confirm'
})

// Initialize Highcharts
Vue.use(HighchartsVue)
annotations(Highcharts)
drilldown(Highcharts)

// Force user to Login, if needed.
// Note that this is not secure with real authorization, it just fakes a user login
// and storing the userId in localStorage.  The currentUser is stored in Vuex.
router.beforeEach((to, from, next) => {
    if (to.name === 'Login') {
        next()
    } else if (!store.state.loggedInUserId) {
        next({name: 'Login'})
    } else if (!store.state.currentUser) {
        UserService.getUser(store.state.loggedInUserId).then(user => {
            store.commit('setCurrentUser', user)
            next()
        }).catch(error => {
            console.error('Error retrieving user', store.state.loggedInUserId, error)
            next()
        })
    } else {
        next()
    }
})

// Create the Vue instance and render the App component at #app
new Vue({
    el: '#app',
    router,
    store,
    vuetify,
    render: (h) => h(App)
})
