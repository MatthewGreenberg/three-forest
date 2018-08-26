/** @jsx h */
const { h, Component } = require('preact');
const BaseComponent = require('../../components/BaseComponent/BaseComponent');
const classnames = require('classnames');
const animate = require('@jam3/gsap-promise');

const MaterialButton = require('../../components/MaterialButton/MaterialButton');
const Header = require('../../components/Header/Header');

class Landing extends BaseComponent {
  constructor (props) {
    super(props);
    this.state = {
    };
  }

  animateIn () {
    return Promise.all([
      this.header.animateIn({ delay: 0.25 }),
      this.button.animateIn({ delay: 0.5 })
    ]);
  }

  animateOut () {
    return Promise.all([
      this.header.animateOut()
    ]);
  }

  render () {
    const classes = classnames({
      'Landing': true
    });
    return (
      <div className={classes} ref={ c => { this.container = c; } }>
        <Header ref={ c => { this.header = c; } }>
          Forest
        </Header>
        <MaterialButton
          onClick={this.props.onRenderTrees}
          ref={ c => { this.button = c; } }>
          Render Forest 
        </MaterialButton>
      </div>
    );
  }
}

Landing.defaultProps = {
  handelRenderTrees: () => {}
};

module.exports = Landing;
