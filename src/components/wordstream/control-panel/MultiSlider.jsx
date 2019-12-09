import 'rc-slider/assets/index.css';

import React from 'react';
import Slider from 'rc-slider';

const Range = Slider.Range;

const style = { width: 400, margin: 50 };

function log(value) {
  console.log(value); //eslint-disable-line
}

export default class CustomizedRange extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      lowerBound: 20,
      upperBound: 40,
      value: [20, 40],
    };
  }
  onLowerBoundChange = (e) => {
    this.setState({ lowerBound: +e.target.value });
  }
  onUpperBoundChange = (e) => {
    this.setState({ upperBound: +e.target.value });
  }
  onSliderChange = (value) => {
    log(value);
    this.setState({
      value,
    });
  }
  render() {
    return (
      <div>
        <Range allowCross={false} min={10} max={50} value={this.state.value} onChange={this.onSliderChange} />
      </div>
    );
  }
}