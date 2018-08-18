import React, { Component, Children } from 'react'
import PropTypes from 'prop-types'
import { storeShape } from '../utils/PropTypes'
import warning from '../utils/warning'

import {ReactReduxContext} from "./context"

let didWarnAboutReceivingStore = false
function warnAboutReceivingStore() {
  if (didWarnAboutReceivingStore) {
    return
  }
  didWarnAboutReceivingStore = true

  warning(
    '<Provider> does not support changing `store` on the fly. ' +
    'It is most likely that you see this error because you updated to ' +
    'Redux 2.x and React Redux 2.x which no longer hot reload reducers ' +
    'automatically. See https://github.com/reduxjs/react-redux/releases/' +
    'tag/v2.0.0 for the migration instructions.'
  )
}

export function createProvider() {

    class Provider extends Component {

        constructor(props) {
          super(props)

            const {store} = props

            this.state = {
                storeState : store.getState(),
                store,
            }
        }

        componentDidMount() {
          this._isMounted = true
          this.subscribe()
        }

        componentWillUnmount() {
          if(this.unsubscribe) this.unsubscribe()

          this._isMounted = false
        }

        componentDidUpdate(prevProps) {
          if(this.props.store !== prevProps.store) {
            if(this.unsubscribe) this.unsubscribe()

            this.subscribe()
          }
        }

        subscribe() {
          const {store} = this.props

          this.unsubscribe = store.subscribe( () => {
            const newStoreState = store.getState()

            if(!this._isMounted) {
              return
            }

            this.setState(providerState => {
              // If the value is the same, skip the unnecessary state update.
              if(providerState.storeState === newStoreState) {
                return null
              }

              return {storeState : newStoreState}
            })
          })

          // Actions might have been dispatched between render and mount - handle those
          const postMountStoreState = store.getState()
          if(postMountStoreState !== this.state.storeState) {
            this.setState({storeState : postMountStoreState})
          }
        }

        render() {
          const ContextProvider = this.props.contextProvider || ReactReduxContext.Provider

            return (
                <ContextProvider value={this.state}>
                    {this.props.children}
                </ContextProvider>
            )
        }
    }


    Provider.propTypes = {
      store: storeShape.isRequired,
      children: PropTypes.element.isRequired,
      contextProvider : PropTypes.object,
    }

    return Provider
}

export default createProvider()
