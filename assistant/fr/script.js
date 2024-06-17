const visualizer = document.getElementById('visualizer');
const startButton = document.getElementById('startButton');
const outputDiv = document.getElementById('output');
const answerText = document.getElementById('answer');
const wikipedia = document.getElementById('wikipedia');
const search = document.getElementById('search');

let pageLink = null, searchLink = null;

const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
recognition.lang = 'fr-FR';
recognition.interimResults = true;
recognition.continuous = true;
let timeout0, timeout1;
let isRecognizing = false;

/* ---------------------------------------- TEXT HANDLING ---------------------------------------- */

function analyzeQuery(query) {
    const doc = nlp(query);
    const nouns = doc.nouns().not('#Pronoun').not('#Determiner').out('array');
    const filteredNouns = nouns.filter(noun => !noun.toLowerCase().includes('thing'));
    const finalNouns = filteredNouns.filter(noun => noun.toLowerCase() !== 'all');

    console.log(finalNouns);
    for (var i = 0; i < finalNouns.length; i++) {
        if (finalNouns[i][0] === finalNouns[i][0].toUpperCase()) {
            return finalNouns[i];
        }
    }

    var link = "https://translate.fedilab.app/translate?q=" + encodeURI(finalNouns[0]) + "&source=fr&target=en&format=text";
    console.log(link);
    fetch(link, {
        method: 'POST',
        headers: {
            'accept': 'application/application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(response => {
        return response.json();
    })
    .then(translateJson => {
        console.log(translateJson.translatedText);
        return translateJson.translatedText;
    });
}

function shortenText(text) {
    let sentences = text.split(/(?<=[.!?]|(?<=[.!?]['"]))\s+(?=\D+)/);

    let result = '';
    for (let sentence of sentences) {
        if ((result + sentence).length <= 400) {
            result += sentence.trim() + ' ';
        } else {
            break;
        }
    }

    return result.length == 0 ? sentences[0].trim() : result.trim();
}

function removePunctuation(text) {
    return text.replace(/[^\w\s.'"]|(\.(?!\d))/g, '');
}

function processResult(result) {
    var link = "https://translate.fedilab.app/translate?q=" + encodeURI(result) + "&source=fr&target=en&format=text";
    fetch(link, {
        method: 'POST',
        headers: {
            'accept': 'application/application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(response => {
        return response.json();
    })
    .then(translateJson => {
        var result = translateJson.translatedText;

        console.log(removePunctuation(result));
        var query = analyzeQuery(removePunctuation(result));
        console.log("Query: " + query);
    
        if (typeof query === 'undefined') {
            var answer = "Je ne comprends pas votre question.";
    
            pageLink = null;
            searchLink = null;
            document.getElementById('subtitle').classList.add("hidden");
            wikipedia.classList.add("hidden");
            document.getElementById('separator').classList.add("hidden");
            search.classList.add("hidden");
    
            speak(answer);
            typeAnswer(answer);
            return;
        }
    
        var link0 = "https://fr.wikipedia.org/api/rest_v1/page/summary/" + encodeURI(query);
        console.log(link0);
    
        fetch(link0)
            .then(response0 => {
                return response0.json();
            })
            .then(result0 => {
                if (result0.type === 'standard') {
                    var answer = shortenText(result0.extract.replaceAll('\\"', '\"').trim());
    
                    pageLink = result0.content_urls.desktop.page;
                    searchLink = "https://www.google.com/search?q=" + encodeURI(query);
                    wikipedia.classList.remove("hidden");
                    document.getElementById('separator').classList.remove("hidden");
                    search.classList.remove("hidden");
                    document.getElementById('subtitle').classList.remove("hidden");

                    speak(answer);
                    typeAnswer(answer);
                } else if (result0.type === 'disambiguation') {
                    var answer = "Pourriez-vous essayer d'être plus précis à propos de \"" + query + "\" ?";
    
                    pageLink = null;
                    searchLink = "https://www.google.com/search?q=" + encodeURI(query);
                    wikipedia.classList.add("hidden");
                    document.getElementById('separator').classList.add("hidden");
                    search.classList.remove("hidden");
                    document.getElementById('subtitle').classList.remove("hidden");
    
                    speak(answer);
                    typeAnswer(answer);
                } else if (result0.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/not_found') {
    
                    fetch("https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURI(query))
                        .then(response1 => {
                            if(!response1.ok) {
                                var answer = "Je n'en sais rien à propos de \"" + query + "\".";
    
                                pageLink = null;
                                searchLink = "https://www.google.com/search?q=" + encodeURI(query);
                                wikipedia.classList.add("hidden");
                                document.getElementById('separator').classList.add("hidden");
                                search.classList.remove("hidden");
                                document.getElementById('subtitle').classList.remove("hidden");
    
                                speak(answer);
                                typeAnswer(answer);
                                return;
                            }
    
                            return response1.json();
                        })
                        .then(result1 => {
                            if (typeof result1.message === 'undefined') {
                                var meaning = result1.meanings[0].definitions[0].definition;
                                var answer = "La définition de \"" + query + "\" est " + meaning + ".";
                                
                                pageLink = null;
                                searchLink = "https://www.google.com/search?q=" + encodeURI(query);
                                wikipedia.classList.add("hidden");
                                document.getElementById('separator').classList.add("hidden");
                                search.classList.remove("hidden");
                                document.getElementById('subtitle').classList.remove("hidden");
                                
                                speak(answer);
                                typeAnswer(answer);
                            }
                        }
                    );
                } else {
                    var answer = "Je ne comprends pas votre question.";
    
                    pageLink = null;
                    searchLink = null;
                    document.getElementById('subtitle').classList.add("hidden");
                    wikipedia.classList.add("hidden");
                    document.getElementById('separator').classList.add("hidden");
                    search.classList.add("hidden");
    
                    speak(answer);
                    typeAnswer(answer);
                    return;
                }
            })
            .catch(error => {
                var answer = error.message;
    
                pageLink = null;
                searchLink = "https://www.google.com/search?q=" + encodeURI(query);
                document.getElementById('subtitle').classList.add("hidden");
                wikipedia.classList.add("hidden");
                document.getElementById('separator').classList.add("hidden");
                search.classList.add("hidden");
    
                speak(answer);
                typeAnswer(answer);
            }
        );
    });
}

function typeAnswer(answer) {
    answerText.textContent = '';
    if (answer.length === 0) {
        answerText.classList.add("hidden");
        return;
    } else {
        answerText.classList.remove("hidden");
    }

    let index = 0;

    function type() {
        if (index < answer.length) {
            answerText.textContent += answer.charAt(index);
            index++;

            if (isRecognizing) {
                answerText.textContent = answer;
                return;
            }

            setTimeout(type, 15);
        }
    }

    type();
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
}

wikipedia.addEventListener('click', () => {
    if (pageLink === null) return;
    window.open(pageLink);
});

search.addEventListener('click', () => {
    if (searchLink === null) return;
    window.open(searchLink);
});

/* ---------------------------------------- SPEECH RECOGNITION ---------------------------------------- */

startButton.addEventListener('click', () => {
    if (isRecognizing) {
        stopRecognition();
    } else {
        startRecognition();
    }
});

recognition.onresult = event => {
    clearTimeout(timeout0);
    clearTimeout(timeout1);
    const result = event.results[event.results.length - 1][0].transcript;
    outputDiv.textContent = "“" + result + "”";
    outputDiv.classList.remove("hidden");
    timeout0 = setTimeout(() => {
        stopRecognition();
        processResult(result);
    }, 2000);
};

function startRecognition() {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }

    recognition.start();
    clearTimeout(timeout0);
    clearTimeout(timeout1);
    startButton.classList.add("hidden");
    visualizer.classList.remove("hidden");
    isRecognizing = true;

    timeout1 = setTimeout(() => {
        stopRecognition();
    }, 3000);
}

function stopRecognition() {
    recognition.stop();
    clearTimeout(timeout0);
    startButton.classList.remove("hidden");
    visualizer.classList.add("hidden");
    isRecognizing = false;
}

navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;
    source.connect(analyser);

    function updateVisualizer() {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const bars = document.querySelectorAll('.bar');
        const startIndex = 5;
        bars.forEach((bar, index) => {
            const dataIndex = index >= startIndex ? index - startIndex : startIndex - index;
            const barHeight = dataArray[dataIndex] / 255 * 100;
            bar.style.height = `${barHeight}%`;
        });

        requestAnimationFrame(updateVisualizer);
    }

    updateVisualizer();
}).catch(function (err) {
    console.error('Failed to Access the Microphone:', err);
})

/* ---------------------------------------- WINDOW EVENTS ---------------------------------------- */

window.onbeforeunload = event => {
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
    }
}

window.addEventListener('resize', function () {
    var windowWidth = window.innerWidth;
    var div = document.getElementById('container');

    if (windowWidth < 700) {
        div.style.minWidth = windowWidth + 'px';
    } else {
        div.style.minWidth = '700px';
    }
});