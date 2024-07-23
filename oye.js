const urlInput = document.getElementById('url');
        const maxRequestsInput = document.getElementById('maxRequests');
        const parallelRequestsInput = document.getElementById('parallelRequests'); 
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        const successCount = document.getElementById('successCount');
        const failureCount = document.getElementById('failureCount');
        const requestLogs = document.getElementById('requestLogs');
        const autoScrollCheckbox = document.getElementById('autoScroll'); 
        const urlError = document.getElementById('urlError'); 

        const targetUrl = "https://clownfish-app-f7unk.ondigitalocean.app/v2/tasks/claimAdsgramAdReward";
        let isRunning = false;
        let cancellationToken;

        startBtn.addEventListener('click', startRequests);
        stopBtn.addEventListener('click', stopRequests);

        async function startRequests() {
            const url = urlInput.value.trim();
            const maxRequests = parseInt(maxRequestsInput.value);
            const parallelRequests = parseInt(parallelRequestsInput.value);

            if (!url.startsWith("https://miniapp.yesco.in/#tgWebAppData")) {
                urlError.classList.remove('hidden'); 
                return; 
            } else {
                urlError.classList.add('hidden'); 
            }

            if (url === '' || isNaN(maxRequests) || isNaN(parallelRequests)) return;

            isRunning = true;
            startBtn.disabled = true;
            stopBtn.disabled = false;

            const queryParams = extractQueryParams(url);
            await sendParallelRequests(queryParams, maxRequests, parallelRequests);
        }

        function stopRequests() {
            isRunning = false;
            startBtn.disabled = false;
            stopBtn.disabled = true;
            if (cancellationToken) {
                cancellationToken.abort();
            }
        }

        async function sendParallelRequests(queryParams, maxRequests, parallelRequests) {
            let sentRequests = 0;

            while (isRunning && sentRequests < maxRequests) {
                const batchSize = Math.min(parallelRequests, maxRequests - sentRequests);
                const requests = Array(batchSize).fill().map(() => 
                    sendSingleRequest(queryParams, cancellationToken)
                );
                await Promise.allSettled(requests); 
                sentRequests += batchSize; 
            }

            if (sentRequests >= maxRequests) {
                stopRequests();
            }
        }

        async function sendSingleRequest(queryParams) { 
            try {
                cancellationToken = new AbortController();
                const response = await fetch(targetUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Reqable-Id': 'reqable-id-ea1b4318-bc3d-431e-9ef5-980b7da9e59d',
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
                        'Accept': 'application/json, text/plain, */*',
                        'accept-language': 'en-US',
                        'launch-params': queryParams.tgWebAppData ? decodeURIComponent(queryParams.tgWebAppData) : '',
                        'origin': 'https://miniapp.yesco.in',
                        'sec-fetch-site': 'cross-site',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-dest': 'empty',
                        'referer': 'https://miniapp.yesco.in/',
                        'priority': 'u=4, i',
                        'Cookie': queryParams.cookie ? decodeURIComponent(queryParams.cookie) : '',
                    },
                    body: JSON.stringify({
                        viewCompletedAt: Date.now(),
                        reference: "81"
                    }),
                    signal: cancellationToken.signal 
                });

                if (response.ok) {
                    successCount.textContent = parseInt(successCount.textContent) + 1;
                    logRequest(`Success: ${response.status} at ${new Date().toLocaleTimeString()}`);
                } else {
                    throw new Error(`Request failed with status ${response.status}`);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    failureCount.textContent = parseInt(failureCount.textContent) + 1;
                    logRequest(`Failure: ${error.message} at ${new Date().toLocaleTimeString()}`);
                }
            }
        }

        function extractQueryParams(url) {
            const queryParams = {};
            const queryString = url.split('#')[1]; 

            if (queryString) {
                const keyValuePairs = queryString.split('&');
                keyValuePairs.forEach(pair => {
                    const [key, value] = pair.split('=');
                    queryParams[key] = value;
                });
            }

            return queryParams;
        }

        function logRequest(message) {
            const li = document.createElement('li');
            li.textContent = message;
            requestLogs.appendChild(li);

            if (autoScrollCheckbox.checked) {
                requestLogs.scrollTop = requestLogs.scrollHeight; 
            }
        }
