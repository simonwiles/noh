import {
  SET_CURRENT_TIME,
  SET_IS_PLAYING,
  SET_START_TIME,
  SET_CURRENT_PHRASE_ID,
  SET_SCORE_TOGGLES
} from "./actions"

const DEFAULT_STATE = {
  currentTime: { time: 0, origin: null },
  isPlaying: false,
  startTime: 0,
  currentPhraseID: "",
  toggles: {}
}

const setCurrentTime = (state, action) =>
  Object.assign({}, state, { currentTime: action.payload })

const setIsPlaying = (state, action) =>
  Object.assign({}, state, { isPlaying: action.payload })

const setStartTime = (state, action) =>
  Object.assign({}, state, { startTime: action.payload })

const setCurrentPhraseID = (state, action) =>
  Object.assign({}, state, { currentPhraseID: action.payload })

const setScoreToggles = (state, action) =>
  Object.assign({}, state, { toggles: action.payload })

const rootReducer = (state = DEFAULT_STATE, action) => {
  switch (action.type) {
    case SET_CURRENT_TIME:
      return setCurrentTime(state, action)
    case SET_IS_PLAYING:
      return setIsPlaying(state, action)
    case SET_START_TIME:
      return setStartTime(state, action)
    case SET_CURRENT_PHRASE_ID:
      return setCurrentPhraseID(state, action)
    case SET_SCORE_TOGGLES:
      return setScoreToggles(state, action)
    default:
      return state
  }
}

export default rootReducer
