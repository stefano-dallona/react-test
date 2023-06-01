
export function base64ToArrayBuffer(base64) {
    //var binary_string = window.atob(base64.replace("b'", "").replace("'", ""));
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

export const concat = (buffer1, buffer2) => {
    const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);

    tmp.set(new Uint8Array(buffer1), 0);
    tmp.set(new Uint8Array(buffer2), buffer1.byteLength);

    return tmp.buffer;
};

export const appendBuffer = (buffer1, buffer2, context) => {
    const numberOfChannels = Math.min(buffer1.numberOfChannels, buffer2.numberOfChannels);
    const tmp = context.createBuffer(numberOfChannels, (buffer1.length + buffer2.length), buffer1.sampleRate);
    for (let i = 0; i < numberOfChannels; i++) {
        const channel = tmp.getChannelData(i);
        channel.set(buffer1.getChannelData(i), 0);
        channel.set(buffer2.getChannelData(i), buffer1.length);
    }
    return tmp;
};

export const withWaveHeader = (data, numberOfChannels, sampleRate, bitsPerSample = 16) => {
    const header = new ArrayBuffer(44);

    const d = new DataView(header);

    d.setUint8(0, "R".charCodeAt(0));
    d.setUint8(1, "I".charCodeAt(0));
    d.setUint8(2, "F".charCodeAt(0));
    d.setUint8(3, "F".charCodeAt(0));

    d.setUint32(4, data.byteLength / 2 + 44, true);

    d.setUint8(8, "W".charCodeAt(0));
    d.setUint8(9, "A".charCodeAt(0));
    d.setUint8(10, "V".charCodeAt(0));
    d.setUint8(11, "E".charCodeAt(0));
    d.setUint8(12, "f".charCodeAt(0));
    d.setUint8(13, "m".charCodeAt(0));
    d.setUint8(14, "t".charCodeAt(0));
    d.setUint8(15, " ".charCodeAt(0));

    d.setUint32(16, 16, true);
    d.setUint16(20, 1, true);
    d.setUint16(22, numberOfChannels, true);
    d.setUint32(24, sampleRate, true);
    d.setUint32(28, sampleRate * numberOfChannels * (bitsPerSample / 8));
    d.setUint16(32, numberOfChannels * (bitsPerSample / 8));
    d.setUint16(34, bitsPerSample, true);

    d.setUint8(36, "d".charCodeAt(0));
    d.setUint8(37, "a".charCodeAt(0));
    d.setUint8(38, "t".charCodeAt(0));
    d.setUint8(39, "a".charCodeAt(0));
    d.setUint32(40, data.byteLength, true);

    return concat(header, data);
};

function detectBrowser() {

    let userAgent = navigator.userAgent;
    let browserName;

    if (userAgent.match(/chrome|chromium|crios/i)) {
        browserName = "chrome";
    } else if (userAgent.match(/firefox|fxios/i)) {
        browserName = "firefox";
    } else if (userAgent.match(/safari/i)) {
        browserName = "safari";
    } else if (userAgent.match(/opr\//i)) {
        browserName = "opera";
    } else if (userAgent.match(/edg/i)) {
        browserName = "edge";
    } else {
        browserName = "No browser detection";
    }
    return browserName
}

export const retrieveFileFromLocalStorage = (uuid) => {
    return new Promise(function (resolve, reject) {
        let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
        let open = indexedDB.open("PlC_TestBench_UI_" + detectBrowser());

        open.onsuccess = function () {
            // Start a new transaction
            let db = open.result;
            if (!db.objectStoreNames.contains("audio_files")) {
                resolve(null);
                return
            }
            let tx = db.transaction("audio_files", "readwrite");
            let store = tx.objectStore("audio_files");

            let persistedAudioFile = store.get(uuid);

            persistedAudioFile.onsuccess = function () {
                resolve(persistedAudioFile.result);
            };

            tx.oncomplete = function () {
                db.close();
            };
        }
    })
}

export const storeFileIntoLocalStorage = (uuid, header, buffer) => {
    let audioFile = {
        uuid: uuid,
        header: {
            channels: header['channels'],
            sampleRate: header['sample_rate'],
            bitsPerSample: header['bits_per_sample']
        },
        data: buffer
    }

    let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
    let request1 = indexedDB.open("PlC_TestBench_UI_" + detectBrowser());
    let version = 1
    request1.onsuccess = function (e) {
        let db = e.target.result;
        version = db.version;
        db.close();
    }
    let request2 = indexedDB.open("PlC_TestBench_UI_" + detectBrowser(), ++version);
    request2.onerror = function () { console.log("error"); };
    request2.onblocked = function () { console.log("blocked"); };
    request2.onupgradeneeded = function (e) {
        let db = e.target.result;
        if (!db.objectStoreNames.contains("audio_files")) {
            let store = db.createObjectStore("audio_files", { keyPath: "uuid" });
        }
    };
    request2.onsuccess = function (e) {
        // Start a new transaction
        let db = e.target.result;
        let tx = db.transaction("audio_files", "readwrite");
        let store = tx.objectStore("audio_files");
        store.put(audioFile);

        tx.oncomplete = function () {
            db.close();
        };
    };
}