/**
 * @file Reducer function for handling the part of the state object that
 * stores the server to connect to.
 */

import { handleActions } from 'redux-actions'

/**
 * The default settings for the part of the state object being defined here.
 *
 * Note that we don't forward the default hostname and port from the
 * configuration object to here because it means that we would be connecting
 * to the default server for a split second when the state is being loaded
 * back from the Redux local storage. Instead of that, we will wait until
 * the Redux store has loaded its state back from the local storage and then
 * check whether we need to fill in the default hostname and port.
 */
const defaultState = {
  hostName: null,
  port: 5000,
  dialogVisible: false
}

/**
 * The reducer function that handles actions related to the server
 * settings.
 */
const reducer = handleActions({
  SHOW_SERVER_SETTINGS_DIALOG: (state, action) => (
    Object.assign({}, state, { 'dialogVisible': true })
  ),

  CLOSE_SERVER_SETTINGS_DIALOG: (state, action) => (
    Object.assign({}, state, action.payload, { 'dialogVisible': false })
  ),

  UPDATE_SERVER_SETTINGS: (state, action) => (
    Object.assign({}, state, action.payload)
  )
}, defaultState)

export default reducer