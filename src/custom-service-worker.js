var jwt_token = ""

/*
wrapping the fetch with event.respondWith() is essential to get proper behaviour
From https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/respondWith:
"The respondWith() method of FetchEvent prevents the browser's default fetch handling, and allows you to provide a promise for a Response yourself."
*/
self.addEventListener('fetch', function (event) {
    if (event.request.url.match(/^.*\/output\-files\/\d+$/)) {
        console.log(`custom service worker invoked for url ${event.request.url}, jwt_token: ${jwt_token}, request.headers: ${event.request.headers.get("range")}`);
        const newRequest = new Request(event.request, {
            headers: {
                "Range": event.request.headers.get("range"),
                "Authorization": jwt_token
            },
            mode: "cors",
            credentials: "omit",
            signal: event.request.signal
        });
        return event.respondWith(fetch(newRequest));
    } else {
        return event.respondWith(fetch(event.request));
    }
})

self.addEventListener('message', event => {
    // event is an ExtendableMessageEvent object
    console.log(`Token received. jwt_token: ${event.data.jwt_token}`);
    jwt_token = event.data.jwt_token
    //event.source.postMessage("Got token");
});