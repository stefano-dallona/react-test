// REFERENCE: https://www.pluralsight.com/guides/how-to-communicate-between-independent-components-in-reactjs
// Written by Gaurav Singhal

const EventBus = {
    on(event, callback) {
        document.addEventListener(event, callback)
    },

    dispatch(event, data) {
        document.dispatchEvent(new CustomEvent(event, { detail: data }))
    },

    remove(event, callback) {
        document.removeEventListener(event, callback)
    }
}

export default EventBus