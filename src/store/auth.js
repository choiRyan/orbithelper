import 'es6-promise/auto'
import Vue from 'vue'
import Vuex from 'vuex'
import {
  recoverAuthToken,
  logout,
  createUser,
  login
} from '../services/api'

Vue.use(Vuex)

const state = () => ({
  currentUser: {} // { token, username }
})

const getters = {
  username (state) {
    return state.currentUser.username
  },
  isAuthed (state) {
    return !!state.currentUser.token
  }
}

// define the possible mutations that can be applied to our state
const mutations = {
  SET_CURRENT_USER: (state, user) => {
    state.currentUser = user
  }
}

const actions = {
  onAppStart ({ commit }) {
    const { token, username } = recoverAuthToken()
    commit('SET_CURRENT_USER', { token, username })
  },
  async register ({ commit, dispatch }, {username, password, passwordVerif, hideFn, onError, onSuccess }) {
    if (!username || !password || !passwordVerif) {
      onError('Registration Incomplete', 'Username and password are required')
      return
    }
    if (username.length > 15) {
      onError('Username too long', 'Usernames should be 15 or fewer characters.')
      return
    }
    if (password.length < 8) {
      onError('Password too short', 'Password should be 8 or more characters')
      return
    }

    try {
      const { token } = await createUser(username, password, passwordVerif)
      commit('SET_CURRENT_USER', { token, username })
      hideFn('login-modal')
      onSuccess('Logged in')
    } catch (e) {
      let msg = ''
      if (e.response) {
        switch (e.response.status) {
          case 400:
            msg = e.response.data || 'Invalid username or password'
            break
          case 0:
            msg = 'Could not connect to server'
            break
        }
      } else {
        msg = 'No internet connection'
      }
      onError('Registration error', msg)
    }
  },
  async login ({ commit, dispatch }, { username, password, hideFn, onError, onSuccess }) {
    try {
      const { token } = await login(username, password)
      commit('SET_CURRENT_USER', { token, username })
      hideFn('login-modal')
      onSuccess('Logged in')
    } catch (e) {
      let msg = ''
      if (e.response) {
        switch (e.response.status) {
          case 400:
            msg = 'Wrong username/password'
            break
          case 0:
            msg = 'Could not connect to server'
            break
        }
      } else {
        msg = 'No internet connection'
      }
      onError('Could not login', msg)
    }
  },
  logout ({ commit, dispatch }) {
    logout()
    commit('SET_CURRENT_USER', {})
  }
}

export default { namespaced: true, state, getters, mutations, actions }