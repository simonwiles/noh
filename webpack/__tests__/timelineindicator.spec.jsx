import React from "react";
import ReactDOM from "react-dom";
import TestUtils from "react-dom/test-utils";
import { mount, shallow } from "enzyme";
import {
  Unwrapped as UnwrappedTimelineIndicator,
  mapDispatchToProps
} from "../components/TimelineIndicator";

describe("<TimelineIndicator>", () => {
  it("renders as expected with no interval, initial currentTime, and is not playing", () => {
    const component = shallow(
      <UnwrappedTimelineIndicator duration={100} currentTime={0} />
    );
    expect(component).toMatchSnapshot();
  });

  it("renders as expected with no interval, currentTime, and is not playing", () => {
    const component = shallow(
      <UnwrappedTimelineIndicator duration={100} currentTime={10} />
    );
    expect(component).toMatchSnapshot();
  });

  it("renders as expected with no interval, currentTime, and is playing", () => {
    const component = shallow(
      <UnwrappedTimelineIndicator duration={100} currentTime={10} playing />
    );
    expect(component).toMatchSnapshot();
  });

  it("renders as expected with interval, currentTime, and is not playing", () => {
    const component = shallow(
      <UnwrappedTimelineIndicator
        duration={100}
        interval={10}
        currentTime={10}
      />
    );
    expect(component).toMatchSnapshot();
  });

  it("renders as expected with interval, currentTime, and is playing", () => {
    const component = shallow(
      <UnwrappedTimelineIndicator
        duration={100}
        interval={10}
        currentTime={10}
        playing
      />
    );
    expect(component).toMatchSnapshot();
  });

  it("unmounts correctly the component", () => {
    const container = document.createElement("div");
    mount(<UnwrappedTimelineIndicator duration={100} currentTime={0} />, {
      attachTo: container
    });
    ReactDOM.unmountComponentAtNode(container);
  });

  it("sets and run the inner timer", () => {
    jest.useFakeTimers();
    expect(setInterval.mock.calls.length).toBe(0);
    mount(
      <UnwrappedTimelineIndicator
        duration={100}
        interval={10}
        currentTime={10}
        playing
      />
    );
    expect(setInterval.mock.calls.length).toBe(1);
  });

  it("clears the timer after video is played", () => {
    const component = mount(
      <UnwrappedTimelineIndicator
        duration={100}
        interval={10}
        currentTime={101}
        playing
      />
    );
    component.instance().tick();
    expect(component.instance().calculateRemainingTime()).toBeLessThanOrEqual(
      0
    );
  });

  it("dispatches the right function for updateCurrentTime", () => {
    const event = { currentTime: 10 };
    const payload = { payload: event, type: "SET_CURRENT_TIME" };
    const dispatch = jest.fn();
    mapDispatchToProps(dispatch).updateCurrentTime(event);
    expect(dispatch).toHaveBeenCalledWith(payload);
  });

  it("changes internal state when indicator is being dragged", () => {
    const component = TestUtils.renderIntoDocument(
      <UnwrappedTimelineIndicator duration={100} currentTime={5} />
    );
    TestUtils.Simulate.mouseDown(component.container);
    expect(component.state.beingDragged).toBe(false);
    component.handleDragStart();
    expect(component.state.beingDragged).toBe(true);
  });

  it("changes internal state when indicator stops being dragged and runs updateCurrentTime prop", () => {
    const duration = 100;
    const updateCurrentTime = jest.fn();
    const component = TestUtils.renderIntoDocument(
      <UnwrappedTimelineIndicator
        currentTime={5}
        duration={duration}
        updateCurrentTime={updateCurrentTime}
      />
    );
    TestUtils.Simulate.mouseDown(component.container);
    expect(component.state.beingDragged).toBe(false);
    component.handleDragStart();
    expect(component.state.beingDragged).toBe(true);
    component.handleDrag();
    component.handleDragStop();
    expect(component.state.beingDragged).toBe(false);
    expect(updateCurrentTime).toHaveBeenCalled();
  });
});
