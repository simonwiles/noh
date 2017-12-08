import {
  SET_CURRENT_TIME,
  SET_IS_PLAYING,
  SET_START_TIME,
  SET_CURRENT_PHRASE_ID
} from "./actions";

export function setCurrentTime(word) {
  return { type: SET_CURRENT_TIME, payload: word };
}

export function setIsPlaying(word) {
  return { type: SET_IS_PLAYING, payload: word };
}

export function setStartTime(word) {
  return { type: SET_START_TIME, payload: word };
}

export function setCurrentPhraseID(idString) {
  return { type: SET_CURRENT_PHRASE_ID, payload: idString };
}
