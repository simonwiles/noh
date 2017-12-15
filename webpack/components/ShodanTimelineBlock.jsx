import React from "react";
import PropTypes from "prop-types";

// Rather than passing in style by props, these should be
// calculated from duration of section and intensity
const ShodanTimelineBlock = props => {
  // should actually check to be sure that intensity is not greater than max
  const heightNum = props.intensity / props.maxIntensity * 100;
  const durationNum = props.duration / props.totalDuration * 100;
  return (
    <div
      className="shodan-map__item"
      style={{
        left: props.left,
        width: `${durationNum}%`,
        height: `${heightNum}%`
      }}
      data-tooltip={props.name}
    />
  );
};

ShodanTimelineBlock.propTypes = {
  left: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  maxIntensity: PropTypes.number.isRequired,
  intensity: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  totalDuration: PropTypes.number.isRequired
};

export default ShodanTimelineBlock;
