import Modifier from 'ember-modifier';
import { dasherize } from '@ember/string';

import { nextTick, sleep, computeTimeout } from 'ember-css-transitions/utils/transition-utils';

/**
  Modifier that applies classes. Usage:

  ```hbs
  <div {{css-transition name="example"}}>
    <p>Hello world</p>
  </div>
  ```

  @class CssTransitionModifier
  @argument didTransitionIn
  @argument didTransitionOut
  @public
*/
export default class CssTransitionModifier extends Modifier {

  clone = null;
  parentElement = null;
  nextElementSibling = null;


  get el() {
    return this.clone || this.element;
  }

  get transitionName() {
    return this.args.positional[0] || this.args.named.name;
  }

  get enterClass() {
    return this.args.named.enterClass || `${this.transitionName}-enter`;
  }

  get enterActiveClass() {
    return this.args.named.enterActiveClass || `${this.transitionName}-enter-active`;
  }

  get leaveClass() {
    return this.args.named.leaveClass || `${this.transitionName}-leave`;
  }

  get leaveActiveClass() {
    return this.args.named.leaveActiveClass || `${this.transitionName}-leave-active`;
  }

  addClassNames(className) {
    return this.args.named.enterClass || `${className}-add`;
  }

  addActiveClassNames(className) {
    return this.args.named.enterActiveClass || `${className}-add-active`;
  }

  removeClassNames(className) {
    return this.args.named.leaveClass || `${className}-remove`;
  }

  removeActiveClassNames(className) {
    return this.args.named.leaveActiveClass || `${className}-remove-active`;
  }

  async didInstall() {

    if (this.enterClass) {
      await this.transition({
        className: this.enterClass,
        activeClassName: this.enterActiveClass
      });

      if (this.args.named.didTransitionIn) {
        this.args.named.didTransitionIn();
      }
    }

    this.parentElement = this.element.parentElement;
    this.nextElementSibling = this.element.nextElementSibling;
  }

  async willRemove() {
    if (this.leaveClass) {
      // We can't stop ember from removing the element
      // so we clone the element to animate it out
      this.addClone();
      await nextTick();

      await this.transition({
        className: this.leaveClass,
        activeClassName: this.leaveActiveClass
      });

      this.removeClone();

      if (this.args.named.didTransitionOut) {
        this.args.named.didTransitionOut();
      }

      this.clone = null;
    }
  }

  prev = {};

  async didUpdateArguments() {
    let key = "name"
    let prevValue = this.prev[key];
    let value = this.args.named[key];
    this.prev[key] = value; // update previous value

    if (prevValue !== value) {
      if (value) {
        let className = dasherize(value);
        this.addClass(className);

        await this.transition({
          className: this.addClassNames(className),
          activeClassName: this.addActiveClassNames(className)
        });

        if (this.args.named.didTransitionIn) {
          this.args.named.didTransitionIn(className);
        }
      } else {
        let className = dasherize(prevValue);

        this.removeClass(className);
        await this.transition({
          className: this.removeClassNames(className),
          activeClassName: this.removeActiveClassNames(className)
        });

        if (this.args.named.didTransitionOut) {
          this.args.named.didTransitionOut(className);
        }
      }
    }
  }

  addClone() {
    let original = this.element;
    let parentElement = original.parentElement || this.parentElement;
    let nextElementSibling = original.nextElementSibling || this.nextElementSibling;
    let clone = original.cloneNode(true);

    clone.setAttribute('id', `${original.id}_clone`);

    parentElement.insertBefore(clone, nextElementSibling);

    this.clone = clone;
  }

  removeClone() {
    if (this.clone.isConnected && this.clone.parentNode !== null) {
      this.clone.parentNode.removeChild(this.clone);
    }
  }

  /**
   * Transitions the element.
   *
   * @private
   * @method transition
   * @param {String} animationType The animation type, e.g. "enter" or "leave".
   * @return {Promise}
   */
  async transition({ className, activeClassName }) {
    let element = this.el;

    // add first class right away
    this.addClass(className);

    await nextTick();

    // This is for to force a repaint,
    // which is necessary in order to transition styles when adding a class name.
    element.scrollTop;

    // add active class, remove first class after repaint
    this.addClass(activeClassName);
    this.removeClass(className);

    // wait for ember to apply classes
    // set timeout for animation end
    await sleep(computeTimeout(element) || 0);

    this.removeClass(className);
    this.removeClass(activeClassName);
  }

  addClass(className) {
    this.el.classList.add(...className.split(' '));
  }

  removeClass(className) {
    this.el.classList.remove(...className.split(' '));
  }

}
