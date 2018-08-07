import Vue from 'vue'
import Vuex from 'vuex'
import {
  commentPost,
  fetchVideoCommentsByPage,
  getUrl
} from '../services/api'
import uniq from '../utils/makeUnique'
import linkify from '../utils/linkify'

Vue.use(Vuex)

const state = () => ({
  comments: [],
  paging: {},
  authorsToShow: new Set()
})

const getters = {
  videoComments: (state, getters) => videoId => {
    // 1:00 comment should show up above 0:59 comment
    return state.comments
      .filter(cmt => cmt && cmt.video_code === videoId)
      .filter(cmt => !state.authorsToShow.size || (state.authorsToShow.has(cmt.author.toLowerCase())))
  },
  nextPageUrl: state => {
    return state.paging.next
  },
  currentVideoTotalCommentCount: state => {
    return state.paging.count || 0
  },
  authorsToShow: state => {
    return [...state.authorsToShow];
  }
}

// define the possible mutations that can be applied to our state
const mutations = {
  ADD_COMMENT (state, comment) {
    comment.text = linkify(comment.text.trim())
    state.comments = uniq([...state.comments, comment], 'id')
  },
  ADD_COMMENTS (state, comments=[]) {
    comments.map(cmt => {
      cmt.text = linkify(cmt.text.trim())
    })
    state.comments = uniq([...state.comments, ...comments], 'id')
  },
  EDIT_PAGING (state, paging={}) {
    state.paging = paging
  },
  EDIT_COMMENT (state, commentId, message) {
    [comment] = state.comments.filter(cmt => cmt.id === commentId)
    if (comment) comment.message = message
    state.comments = [...state.comments, comment]
  },
  DELETE_COMMENT (state, commentId) {
    state.comments = state.comments.filter(cmt => cmt.id !== commentId)
  },
  SET_AUTHORS_TO_SHOW (state, usernames) {
    if (usernames) {
      const usernamesLower = usernames.map(x => x.toLowerCase())
      state.authorsToShow = new Set([...usernamesLower])
    }
  },
  REMOVE_AUTHOR_TO_SHOW (state, username) {
    state.authorsToShow.delete(username)
  }
}

const actions = {
  async fetchFirstPage ({ commit }, { code, page=1 }) {
    const paging = await fetchVideoCommentsByPage(code, page)
    commit('ADD_COMMENTS', paging.results)
    commit('EDIT_PAGING', paging)
  },
  async fetchNextPage ({ commit, getters, state }) {
    const url = getters['nextPageUrl']
    if (url) {
      const paging = await getUrl(url)
      commit('EDIT_PAGING', paging)
      commit('ADD_COMMENTS', paging.results)
    }
  },
  async post ({ commit, rootGetters }, { code, time, text, clearTextAreaFn }) {
    if (!code || !text) return
    if (!rootGetters['auth/isAuthed']) {
      Vue.notify({
        group: 'base',
        title: 'You must be logged in to comment',
        type: 'error'
      })
      return
    }
    text = text.trim()

    try {
      const data = await commentPost({ code, time, text })
      commit('ADD_COMMENT', data)
      Vue.notify({
        group: 'base',
        title: 'Comment Submitted',
        type: 'success'
      })
      clearTextAreaFn()
    } catch (e) {
      console.log(e)
      Vue.notify({
        group: 'base',
        title: 'Failed to submit comment',
        type: 'error'
      })
    }
  },
  async delete ({ commit }, commentId) {
    // delete comment user owns
    Vue.notify({
      group: 'base',
      title: 'TODO delete comment',
      type: 'error'
    })
  },
  async edit ({ commit }, { commentId, time, text }) {
    // edit comment (if logged in)
    Vue.notify({
      group: 'base',
      title: 'TODO edit comment',
      type: 'error'
    })
  }
}

export default { namespaced: true, state, getters, mutations, actions }
