var jwt_token = ""

/*
wrapping the fetch with event.respondWith() is essential to get proper behaviour
From https://developer.mozilla.org/en-US/docs/Web/API/FetchEvent/respondWith:
"The respondWith() method of FetchEvent prevents the browser's default fetch handling, and allows you to provide a promise for a Response yourself."
*/
self.addEventListener('fetch', function (event) {
    class RetriableError extends Error { }
    class FatalError extends Error { }

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
    /*
    } else if (event.request.url.match(/^.*\/events\?.*$/)) {
        let error_callback = (err) => { console.error("EventSource failed:", err) }
        //let url = event.request.url
        let url = "https://localhost:5000/runs/49557303196154904/executions/49557303196154904/events?task_id=34c7ad96-287e-4079-8d5c-901b12e8a289"
        return event.respondWith(fetch(url, {
            openWhenHidden: true,
            headers: {
                'Authorization': jwt_token,
                'Content-Type': 'text/event-stream'
            },
            onmessage(msg) {
                if (msg.event === 'run_execution') {
                    console.log(msg)
                }
            },
            onclose() {
                // if the server closes the connection unexpectedly, retry:
                throw new RetriableError();
            },
            onerror(err) {
                error_callback(err)
                if (err instanceof FatalError) {
                    throw err; // rethrow to stop the operation
                } else if (err instanceof FatalError) {
                    throw err;
                } else {
                    // do nothing to automatically retry. You can also
                    // return a specific retry interval here.
                }
            },
            signal: event.request.signal
        }));
    */
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