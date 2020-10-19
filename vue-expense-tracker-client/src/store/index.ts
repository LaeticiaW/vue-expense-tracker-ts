import Vue from 'vue'
import Vuex from 'vuex'
import UserService from '../services/user'

Vue.use(Vuex)

export default new Vuex.Store({
    state: {
        loggedInUserId: localStorage.getItem('etLoginToken'),
        currentUser: null
    },
    mutations: {
        setLoggedInUserId(state, userId) {
            state.loggedInUserId = userId
        },
        setCurrentUser(state, user) {
            state.currentUser = user
        }
    },
    actions: {
        login({commit}, userId) {
            return UserService.getUser(userId).then(user => {
                localStorage.setItem('etLoginToken', user.id)
                commit('setCurrentUser', user)
                commit('setLoggedInUserId', user.id)
            })
        },
        logout({commit}) {
            localStorage.removeItem('etLoginToken')
            commit('setLoggedInUserId', null)
            commit('setCurrentUser', null)
        },
        setCurrentUser({commit}, user) {
            commit('setCurrentUser', user)
        }
    },
    modules: {}
})
