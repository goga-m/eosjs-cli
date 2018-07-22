const { Machine } = require('xstate')

/**
 * Dispatch machine states
 *
 * @name dispatch
 * @function
 * @param {Object<String>} event Machine event
 * @param {String} event.type Type of event
 * @param {String} event.state State where the event type should apply
 * @param {Object} machine Machine definition object
 * @param {Object} actions Object with all required machine actions
 */
const dispatch = (event, machine, actions) => {
  // Get the next state from the machine
  const nextState = machine.transition(event.state, event.type)
  // Get the actions of this state and call them
  // asynchronously
  nextState.actions.forEach(actionKey => {
    const action = actions[actionKey]
    if (action) {
      action(event, (type, data) => {
        const newEvent = { state: nextState.value, type, data }
        dispatch(newEvent, machine, actions)
      })
    }
  })
}

/**
 * Start state machine
 *
 * @name start
 * @function
 * @param {Object<String>} event Initial event to start from
 * @param {String} event.type type of event to trigger
 * @param {String} event.state state from where to trigger the the event type
 * @param {Object} machineStates Machine states
 * @param {Object} actions Machine actions
 */
const start = ({type, state, states, actions}) => {
  const machine = Machine(states)
  dispatch({ type, state }, machine, actions)
}

module.exports = {
  start
}