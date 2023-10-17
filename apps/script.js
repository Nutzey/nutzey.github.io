let youtube = new Audio("audio/youtube.mp3");
let twitter = new Audio("audio/twitter.mp3");
let amazon = new Audio("audio/amazon.mp3");
let facebook = new Audio("audio/facebook.mp3");
let snapchat = new Audio("audio/snapchat.mp3");
let spotify = new Audio("audio/spotify.mp3");
let tiktok = new Audio("audio/tiktok.mp3");
let netflix = new Audio("audio/netflix.mp3");
let whatsapp = new Audio("audio/whatsapp.mp3");

function removeBlurOverlay() {
    document.getElementById("blur-overlay").remove();
}

function playYouTubeSound() {
    youtube.play();
}

function playTwitterSound() {
    twitter.play();
}

function playAmazonSound() {
    amazon.play();
}

function playFacebookSound() {
    facebook.play();
}

function playSnapchatSound() {
    snapchat.play();
}

function playSpotifySound() {
    spotify.play();
}

function playTikTokSound() {
    tiktok.play();
}

function playNetflixSound() {
    netflix.play();
}

function playWhatsAppSound() {
    whatsapp.play();
}