/* eslint-disable jsx-a11y/media-has-caption */
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { setCurrentTime, setIsPlaying } from "../actionCreators";

const MasterVideoOrigin = "MasterVideo";

class MasterVideo extends Component {
  constructor(props) {
    super(props);

    this.video = null;
  }

  componentDidMount() {
    this.forceUpdate();
  }

  componentDidUpdate() {
    if (
      this.props.currentTimeOrigin !== MasterVideoOrigin &&
      this.video.currentTime !== this.props.currentTime
    ) {
      this.video.currentTime = this.props.currentTime;
    }
  }

  createTracks() {
    return this.props.tracks.map(track => (
      <track
        key={track.label}
        label={track.label}
        kind={track.kind}
        srcLang={track.lang}
        src={track.url}
      />
    ));
  }

  render() {
    const tracks = this.createTracks();
    return (
      <div>
        <video
          id="player"
          ref={video => {
            this.video = video;
          }}
          controls
          controlsList="nodownload"
          onTimeUpdate={event => this.props.updateCurrentTime(event)}
          onPlaying={() => this.props.updateIsPlaying(true)}
          onEnded={() => this.props.updateIsPlaying(false)}
          onPlay={() => this.props.updateIsPlaying(false)}
          onPause={() => this.props.updateIsPlaying(false)}
          onStalled={() => this.props.updateIsPlaying(false)}
          onSeeking={event => this.props.updateCurrentTime(event)}
          onWaiting={() => this.props.updateIsPlaying(false)}
        >
          <source src={this.props.videoUrl} type="video/mp4" />
          {tracks}
        </video>
      </div>
    );
  }
}

MasterVideo.propTypes = {
  currentTime: PropTypes.number,
  currentTimeOrigin: PropTypes.string,
  videoUrl: PropTypes.string,
  updateCurrentTime: PropTypes.func,
  updateIsPlaying: PropTypes.func,
  tracks: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      kind: PropTypes.string,
      lang: PropTypes.string,
      url: PropTypes.string
    })
  )
};

MasterVideo.defaultProps = {
  currentTime: 0,
  currentTimeOrigin: "",
  videoUrl: "",
  updateCurrentTime: null,
  updateIsPlaying: null,
  tracks: []
};

const mapStateToProps = state => ({
  currentTime: state.currentTime.time,
  currentTimeOrigin: state.currentTime.origin,
  isPlaying: state.isPlaying
});

export const mapDispatchToProps = dispatch => ({
  updateCurrentTime: event => {
    dispatch(
      setCurrentTime({
        time: event.target.currentTime,
        origin: MasterVideoOrigin
      })
    );
  },
  updateIsPlaying: isPlaying => {
    dispatch(setIsPlaying(isPlaying));
  }
});

export const Unwrapped = MasterVideo;
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MasterVideo);
