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
  @argument {Function} [didTransitionIn]
  @argument {Function} [didTransitionOut]
  @public
*/
export default class CssTransitionModifier extends Modifier {

  clone = null;
  parentElement = null;
  nextElementSibling = null;
  prevState = null;

  /**
   * @type {(HTMLElement|undefined)}
   * @private
   * @readonly
   */
  get el() {
    return this.clone || this.element;
  }

  /**
   * @type {(String|undefined)}
   * @private
   * @readonly
   */
  get transitionName() {
    return this.args.positional[0] || this.args.named.name;
  }

  /**
   * @type {(String|undefined)}
   * @private
   * @readonly
   */
  get enterClass() {
    return this.args.named.enterClass || this.transitionName && `${this.transitionName}-enter`;
  }

  /**
   * @type {(String|undefined)}
   * @private
   * @readonly
   */
  get enterActiveClass() {
    return this.args.named.enterActiveClass || this.transitionName && `${this.transitionName}-enter-active`;
  }

  /**
   * @type {(String|undefined)}
   * @private
   * @readonly
   */
  get leaveClass() {
    return this.args.named.leaveClass || this.transitionName && `${this.transitionName}-leave`;
  }

  /**
   * @type {(String|undefined)}
   * @private
   * @readonly
   */
  get leaveActiveClass() {
    return this.args.named.leaveActiveClass || this.transitionName && `${this.transitionName}-leave-active`;
  }

  async didInstall() {
    if (Object.prototype.hasOwnProperty.call(this.args.named, 'state')) {
      this.prevState = this.args.named['state'];
      if (this.prevState) {
        this.addClass(dasherize(this.prevState));
      }

      return;
    }

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

  async didUpdateArguments() {
    let prevState = this.prevState;
    let state = this.args.named['state'];
    this.prevState = state; // update previous state

    if (prevState !== state) {
      if (state) {
        let className = dasherize(state);
        this.addClass(className);

        await this.transition({
          className: `${className}-add`,
          activeClassName: `${className}-add-active`
        });

        if (this.args.named.didTransitionIn) {
          this.args.named.didTransitionIn(className);
        }
      } else {
        let className = dasherize(prevState);

        this.removeClass(className);
        await this.transition({
          className: `${className}-remove`,
          activeClassName: `${className}-remove-active`
        });

        if (this.args.named.didTransitionOut) {
          this.args.named.didTransitionOut(className);
        }
      }
    }
  }

  /**
   * Adds a clone to the parentElement so it can be transitioned out
   *
   * @private
   * @method addClone
   * @return {[HTMLElement]}
   */
  addClone() {
    let original = this.element;
    let parentElement = original.parentElement || this.parentElement;
    let nextElementSibling = original.nextElementSibling || this.nextElementSibling;
    let clone = original.cloneNode(true);

    clone.setAttribute('id', `${original.id}_clone`);

    parentElement.insertBefore(clone, nextElementSibling);

    this.clone = clone;
  }

  /**
   * Removes the clone from the parentElement
   *
   * @private
   * @method removeClone
   * @return {[HTMLElement]}
   */
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
   * @param {Object} args
   * @param {String} args.className the class representing the starting state
   * @param {String} args.activeClassName the class representing the finished state
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

  /**
   * Add classNames to el.
   *
   * @private
   * @method addClass
   * @param {String} classNames
   * @return {DOMTokenList}
   */
  addClass(className) {
    this.el.classList.add(...className.split(' '));
  }

  /**
   * Remove classNames from el.
   *
   * @private
   * @method removeClass
   * @param {String} classNames
   * @return {DOMTokenList}
   */
  removeClass(className) {
    this.el.classList.remove(...className.split(' '));
  }
}
