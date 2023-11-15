self.onmessage = function (e) {
    const fileUrls = e.data;
    Promise.all(fileUrls.map(url => fetch(url).then(response => response.json())))
        .then(data => {
            // Send data back to the main thread
            self.postMessage(data);
        });
};