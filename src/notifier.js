// @flow

'use strict';

const path = require('path');
const readJson = require('read-package-json');
const ua = require('universal-analytics');

const createStore = require('redux').createStore;
const combineReducers = require('redux-immutable').combineReducers;
const triggerReducer = require('./reducers/notifier-reducer').reducer;
const actions = require('./actions/notifier-action').actions;

class Notifier {
  action: string;
  dispatcher: any;
  visitor: any;

  constructor(action: string) {
    let analyticsUserIdentifier = 'UA-43265839-1';
    if (typeof process.env.UA_ID !== 'undefined') {
      analyticsUserIdentifier = process.env.UA_ID;
    }

    this.action = action || 'execute';
    this.visitor = ua(analyticsUserIdentifier);
    this.dispatcher = createStore(
      combineReducers({
        trigger: triggerReducer,
      }),
    );
  }

  static getMainConfiguration(): string {
    return path.join(path.resolve(__dirname).split('node_modules')[0], 'package.json');
  }

  notify(error: any, data: any): any {
    let state;
    try {
      state = this.dispatcher.dispatch(actions[this.action](), 'test');
    } catch (executionError) {
      throw new Error(executionError);
    }

    if (
      error === null &&
      Object.prototype.hasOwnProperty.call(state, 'payload') &&
      __dirname.indexOf('node_modules') >= 0
    ) {
      const rawData = JSON.parse(JSON.stringify(data));

      // Delete big entries (readme)
      delete rawData.readme;

      this.visitor.event('node', state.type, JSON.stringify(rawData), 0).send();
    }

    return state;
  }

  trigger() {
    const that = this;
    readJson(Notifier.getMainConfiguration(), null, false, (error, data) => {
      that.notify(error, data);
    });
  }
}

module.exports = Notifier;
